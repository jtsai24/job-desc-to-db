const JOB_DATA_SOURCE_ID =
  "3588d66b-99dd-8084-a239-000b69f0949f";

export async function checkForDuplicate(notionToken, applicationFields) {
  const filters = [];

  if (applicationFields.url) {
    filters.push({
      property: "URL",
      url: { contains: cleanUrl(applicationFields.url) },
    });
  }

  if (applicationFields.company && applicationFields.jobTitle) {
    filters.push({
      and: [
        {
          property: "Company",
          rich_text: { equals: applicationFields.company },
        },
        {
          property: "Job Title",
          rich_text: { equals: applicationFields.jobTitle },
        },
      ],
    });
  }

  if (filters.length === 0) {
    return null;
  }

  const response = await fetch(
    `https://api.notion.com/v1/data_sources/${JOB_DATA_SOURCE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2026-03-11",
      },
      body: JSON.stringify({
        filter: {
          or: filters,
        },
      }),
    },
  );

  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(
      responseBody.message ?? `Notion returned status ${response.status}`,
    );
  }

  const matches = responseBody.results ?? [];
  const sameUrlMatch = matches.find((match) => {
    const existingUrl = match.properties?.URL?.url;
    return cleanUrl(existingUrl) === cleanUrl(applicationFields.url);
  });

  if (sameUrlMatch) {
    return {
      warningLevel: "red",
      existingPage: sameUrlMatch,
    };
  }

  if (matches.length > 0) {
    return {
      warningLevel: "yellow",
      existingPage: matches[0],
    };
  }

  return null;
}

function cleanUrl(rawUrl) {
  if (!rawUrl) {
    return "";
  }

  const url = new URL(rawUrl);
  const isLinkedInJob =
    url.hostname.endsWith("linkedin.com") &&
    url.pathname.startsWith("/jobs/view/");

  if (isLinkedInJob) {
    const jobId = url.pathname
      .replace("/jobs/view/", "")
      .split("/")[0];

    if (/^\d+$/.test(jobId)) {
      return `https://www.linkedin.com/jobs/view/${jobId}`;
    }
  }

  return url.href;
}
