// This file is the coordinator for extracting fields from a job webpage.
(() => {
  function cleanJobUrl(rawUrl) {
    const url = new URL(rawUrl, window.location.href);
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

  function extractSiteSpecificCompany() {
    if (isLinkedInJobPage()) {
      return extractLinkedInCompany();
    }

    if (isJobrightJobPage()) {
      return extractJobrightCompany();
    }

    return null;
  }

  function chooseCompanyName(siteSpecificFields, titleParts) {
    if (siteSpecificFields?.company) {
      return siteSpecificFields.company;
    }

    if (titleParts.length > 1) {
      return titleParts.at(-1);
    }

    return null;
  }

  function extractSiteSpecificListingDetails() {
    if (isLinkedInJobPage()) {
      return {
        workplaceType: extractLinkedInWorkplaceType(),
        jobLocation: extractLinkedInJobLocation(),
        postedDateRaw: extractLinkedInPostedDateRaw(),
      };
    }

    if (isJobrightJobPage()) {
      return extractJobrightListingDetails();
    }

    return {
      workplaceType: null,
      jobLocation: null,
      postedDateRaw: null,
    };
  }

  const siteSpecificDetails =
    extractSiteSpecificListingDetails();

  // First choice: standard Schema.org JobPosting structured data.
  const jsonLdScripts = document.querySelectorAll(
    'script[type="application/ld+json"]',
  );

  for (const script of jsonLdScripts) {
    try {
      const json = JSON.parse(script.textContent);
      const objects = Array.isArray(json) ? json : [json];
      const candidates = objects.flatMap((object) => object["@graph"] ?? object);
      const jobPosting = candidates.find((object) => {
        const type = object?.["@type"];
        return type === "JobPosting" || type?.includes?.("JobPosting");
      });

      if (jobPosting) {
        return {
          jobTitle: jobPosting.title?.trim() ?? null,
          company: jobPosting.hiringOrganization?.name?.trim() ?? null,
          url: cleanJobUrl(jobPosting.url ?? window.location.href),
          workplaceType: siteSpecificDetails?.workplaceType ?? null,
          jobLocation: siteSpecificDetails?.jobLocation ?? null,
          postedDateRaw: siteSpecificDetails?.postedDateRaw ?? null,
          captureMethod: "Structured data: Schema.org JobPosting",
        };
      }
    } catch {
      // Continue if this script does not contain valid JSON-LD.
    }
  }

  // No JobPosting was found. Try rules for a recognized job board.
  const siteSpecificFields = extractSiteSpecificCompany();

  // Last choice: generic rules that work without knowing the job board.
  const titleParts = document.title
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    jobTitle:
      document.querySelector("h1")?.textContent?.trim() ??
      titleParts[0] ??
      null,
    company: chooseCompanyName(siteSpecificFields, titleParts),
    url: cleanJobUrl(window.location.href),
    workplaceType: siteSpecificDetails?.workplaceType ?? null,
    jobLocation: siteSpecificDetails?.jobLocation ?? null,
    postedDateRaw: siteSpecificDetails?.postedDateRaw ?? null,
    captureMethod:
      siteSpecificFields?.captureMethod ??
      "Page rules: h1 and document title",
  };
})();
