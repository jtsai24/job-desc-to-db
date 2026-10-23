function captureJobDescription() {
  const siteSpecificDescription = readSiteSpecificDescription();

  if (siteSpecificDescription) {
    return siteSpecificDescription;
  }

  const jsonLdScripts = document.querySelectorAll(
    'script[type="application/ld+json"]',
  );

  for (const script of jsonLdScripts) {
    try {
      const json = JSON.parse(script.textContent);
      const objects = Array.isArray(json) ? json : [json];
      const candidates = objects.flatMap(
        (object) => object["@graph"] ?? object,
      );

      const jobPosting = candidates.find((object) => {
        const type = object?.["@type"];

        return type === "JobPosting" || type?.includes?.("JobPosting");
      });

      if (jobPosting?.description) {
        const parsedDescription = new DOMParser().parseFromString(
          jobPosting.description,
          "text/html",
        );

        return {
          jobDescription: parsedDescription.body.innerText.trim(),
          captureMethod:
            "Structured data: Schema.org JobPosting description",
        };
      }
    } catch {
      // Continue when a JSON-LD script cannot be parsed.
    }
  }

  return {
    jobDescription: null,
    captureMethod: "Job description not found",
  };
}

function readSiteSpecificDescription() {
  const isLinkedInJobPage =
    window.location.hostname.endsWith("linkedin.com") &&
    window.location.pathname.startsWith("/jobs/view/");

  if (isLinkedInJobPage) {
    return readLinkedInAboutTheJob();
  }

  const isJobrightJobPage =
    window.location.hostname === "jobright.ai" &&
    window.location.pathname.startsWith("/jobs/info/");

  if (isJobrightJobPage) {
    return readJobrightJobDescription();
  }

  return null;
}

function readLinkedInAboutTheJob() {
  const aboutJobHeading = [...document.querySelectorAll("h2")].find(
    (heading) => heading.textContent.trim() === "About the job",
  );

  if (!aboutJobHeading) {
    return null;
  }

  const descriptionElement =
    aboutJobHeading.parentElement.nextElementSibling.querySelector(
      '[data-testid="expandable-text-box"]',
    );

  if (!descriptionElement) {
    return null;
  }

  return {
    jobDescription: descriptionElement.innerText.trim(),
    captureMethod: "Page rules: LinkedIn About the job",
  };
}

function readJobrightJobDescription() {
  const embeddedDescription = readJobrightEmbeddedDescription();

  if (embeddedDescription) {
    return embeddedDescription;
  }

  const companyHeading = [...document.querySelectorAll("h2")].find(
    (heading) =>
      /\b(?:reposted\s+)?\d+\s+(?:minute|hour|day|week|month)s?\s+ago\b/i.test(
        heading.textContent,
      ),
  );
  const company = companyHeading?.textContent
    ?.split(/[\u00b7•]/, 1)[0]
    ?.trim();
  const summaryCandidates = [...document.querySelectorAll("p, div")].filter(
    (element) => {
      const text = element.innerText?.trim();

      return (
        company &&
        text?.startsWith(company) &&
        text.length >= 100 &&
        !element.querySelector("h1, h2, h3, h4")
      );
    },
  );
  const summary = summaryCandidates
    .sort((left, right) => left.innerText.length - right.innerText.length)
    .at(0)
    ?.innerText.trim();
  const sectionNames = ["Responsibilities", "Qualification", "Benefits"];
  const sectionTexts = sectionNames
    .map((sectionName) => readJobrightSection(sectionName))
    .filter(Boolean);
  const descriptionParts = [summary, ...sectionTexts].filter(Boolean);

  if (descriptionParts.length === 0) {
    return null;
  }

  return {
    jobDescription: descriptionParts.join("\n\n"),
    captureMethod: "Page rules: Jobright job sections",
  };
}

function readJobrightEmbeddedDescription() {
  const nextDataScript = document.querySelector("#__NEXT_DATA__");

  if (!nextDataScript?.textContent) {
    return null;
  }

  try {
    const nextData = JSON.parse(nextDataScript.textContent);
    const jobResult = nextData?.props?.pageProps?.dataSource?.jobResult;

    if (!jobResult) {
      return null;
    }

    const descriptionParts = [];

    if (jobResult.jobSummary) {
      descriptionParts.push(jobResult.jobSummary.trim());
    }

    const responsibilities = formatJobrightList(
      "Responsibilities",
      jobResult.coreResponsibilities,
    );

    if (responsibilities) {
      descriptionParts.push(responsibilities);
    }

    const qualificationParts = [];
    const requiredQualifications = formatJobrightList(
      "Required",
      jobResult.qualifications?.mustHave,
    );
    const preferredQualifications = formatJobrightList(
      "Preferred",
      jobResult.qualifications?.preferredHave,
    );

    if (requiredQualifications) {
      qualificationParts.push(requiredQualifications);
    }

    if (preferredQualifications) {
      qualificationParts.push(preferredQualifications);
    }

    if (qualificationParts.length > 0) {
      descriptionParts.push(
        `Qualification\n${qualificationParts.join("\n\n")}`,
      );
    }

    const benefits = formatJobrightList(
      "Benefits",
      jobResult.benefitsSummaries,
    );

    if (benefits) {
      descriptionParts.push(benefits);
    }

    if (descriptionParts.length === 0) {
      return null;
    }

    return {
      jobDescription: descriptionParts.join("\n\n"),
      captureMethod: "Embedded data: Jobright job result",
    };
  } catch {
    return null;
  }
}

function formatJobrightList(heading, items) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return `${heading}\n${items.map((item) => `- ${item}`).join("\n")}`;
}

function readJobrightSection(sectionName) {
  const nextSectionName = {
    Responsibilities: "Qualification",
    Qualification: "Benefits",
    Benefits: "Company",
  }[sectionName];
  const heading = [...document.querySelectorAll("h2")].find(
    (element) => element.textContent.trim() === sectionName,
  );
  const nextHeading = [...document.querySelectorAll("h2")].find(
    (element) => element.textContent.trim() === nextSectionName,
  );

  if (!heading) {
    return null;
  }

  if (nextHeading) {
    const sectionRange = document.createRange();
    sectionRange.setStartBefore(heading);
    sectionRange.setEndBefore(nextHeading);
    const sectionText = sectionRange.toString().trim();

    if (sectionText) {
      return sectionText;
    }
  }

  let sectionContainer = heading.parentElement;

  for (let depth = 0; sectionContainer && depth < 4; depth += 1) {
    const text = sectionContainer.innerText?.trim();

    if (text && text.length > sectionName.length + 20) {
      return text;
    }

    sectionContainer = sectionContainer.parentElement;
  }

  return null;
}

captureJobDescription();
