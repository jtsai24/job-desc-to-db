// This file is the coordinator for extracting fields from a job webpage.
(() => {
  function extractLinkedInCompany() {
    const isLinkedInJobPage =
      window.location.hostname.endsWith("linkedin.com") &&
      window.location.pathname.startsWith("/jobs/view/");

    if (!isLinkedInJobPage) {
      return null;
    }

    // Prefer the visible name in the company's LinkedIn profile link.
    const companyFromLink = document
      .querySelector('a[href*="linkedin.com/company/"], a[href^="/company/"]')
      ?.textContent
      ?.trim();

    if (companyFromLink) {
      return {
        company: companyFromLink,
        captureMethod: "Page rules: LinkedIn company link and h1",
      };
    }

    // If the link is missing, extract the name from an accessible logo label
    // such as "Company logo for, TikTok."
    const companyLogoAlt = document
      .querySelector('img[alt^="Company logo for,"]')
      ?.getAttribute("alt");

    const companyFromLogo = companyLogoAlt
      ?.replace(/^Company logo for,\s*/, "")
      .replace(/\.$/, "")
      .trim();

    if (companyFromLogo) {
      return {
        company: companyFromLogo,
        captureMethod: "Page rules: LinkedIn company-logo alt text and h1",
      };
    }

    return null;
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
          url: jobPosting.url ?? window.location.href,
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
    url: window.location.href,
    captureMethod:
      jobBoardFields?.captureMethod ??
      "Page rules: h1 and document title",
  };
})();
