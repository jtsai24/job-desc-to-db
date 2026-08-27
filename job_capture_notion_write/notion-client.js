const JOB_DATA_SOURCE_ID =
  "3588d66b-99dd-8084-a239-000b69f0949f";

const WORKPLACE_TYPE_TO_LOCATION_TYPE = {
  remote: "remote only",
  hybrid: "hybrid",
  "on-site": "onsite",
};

export async function createNotionApplication(
  notionToken,
  applicationFields,
) {
  let notionSource = "company website";

  const jobPageHostname = new URL(applicationFields.url).hostname;

  if (jobPageHostname.endsWith("linkedin.com")) {
    notionSource = "linkedin";
  }

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": "2026-03-11",
    },
    body: JSON.stringify({
      parent: {
        data_source_id: JOB_DATA_SOURCE_ID,
      },
      properties: {
        "sort id": {
          title: [
            {
              text: {
                content: applicationFields.sortId,
              },
            },
          ],
        },
        "Job Title": {
          rich_text: [
            {
              text: {
                content: applicationFields.jobTitle,
              },
            },
          ],
        },
        Company: {
          rich_text: [
            {
              text: {
                content: applicationFields.company,
              },
            },
          ],
        },
        "Date first seen": {
          date: {
            start: applicationFields.dateFirstSeen,
          },
        },
        URL: {
          url: applicationFields.url,
        },
        source: {
          select: {
            name: notionSource,
          },
        },
        "job type": {
          select: {
            name: applicationFields.jobType,
          },
        },
        status: {
          select: {
            name: applicationFields.status,
          },
        },
        "Capture Method": {
          rich_text: [
            {
              text: {
                content: applicationFields.captureMethod,
              },
            },
          ],
        },
        ...(applicationFields.jobLocation
          ? {
              Location: {
                rich_text: [
                  { text: { content: applicationFields.jobLocation } },
                ],
              },
            }
          : {}),
        ...(WORKPLACE_TYPE_TO_LOCATION_TYPE[applicationFields.workplaceType]
          ? {
              "location type": {
                select: {
                  name: WORKPLACE_TYPE_TO_LOCATION_TYPE[
                    applicationFields.workplaceType
                  ],
                },
              },
            }
          : {}),
        ...(applicationFields.postedDateRaw
          ? {
              "Posted Date Raw": {
                rich_text: [
                  { text: { content: applicationFields.postedDateRaw } },
                ],
              },
            }
          : {}),
      },
    }),
  });

  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(
      responseBody.message ?? `Notion returned status ${response.status}`,
    );
  }

  return responseBody;
}

export async function createNotionJobDescription(
  notionToken,
  applicationPageId,
  jobDescription,
) {
  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": "2026-03-11",
    },
    body: JSON.stringify({
      parent: {
        page_id: applicationPageId,
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: "Job Description",
              },
            },
          ],
        },
      },
      markdown: jobDescription,
    }),
  });

  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(
      responseBody.message ?? `Notion returned status ${response.status}`,
    );
  }

  return responseBody;
}
