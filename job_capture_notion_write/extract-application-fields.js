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

  function chooseCompanyName(jobBoardFields, titleParts) {
    if (jobBoardFields?.company) {
      return jobBoardFields.company;
    }

    if (titleParts.length > 1) {
      return titleParts.at(-1);
    }

    return null;
  }

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
          captureMethod: "Structured data: Schema.org JobPosting",
        };
      }
    } catch {
      // Continue if this script does not contain valid JSON-LD.
    }
  }

  // No JobPosting was found. Try job-board-specific rules. The LinkedIn
  // method returns null when this is not a LinkedIn job page.
  const jobBoardFields = extractLinkedInCompany();

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
    company: chooseCompanyName(jobBoardFields, titleParts),
    url: cleanJobUrl(window.location.href),
    workplaceType: extractLinkedInWorkplaceType(),
    postedDateRaw: extractLinkedInPostedDateRaw(),
    captureMethod:
      jobBoardFields?.captureMethod ??
      "Page rules: h1 and document title",
  };
})();
