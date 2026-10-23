// Jobright-specific field extraction helpers. Loaded before
// extract-application-fields.js by browser.scripting.executeScript.

function isJobrightJobPage() {
  return (
    window.location.hostname === "jobright.ai" &&
    window.location.pathname.startsWith("/jobs/info/")
  );
}

function extractJobrightCompany() {
  if (!isJobrightJobPage()) {
    return null;
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

  if (!company) {
    return null;
  }

  return {
    company,
    captureMethod: "Page rules: Jobright company heading and h1",
  };
}

function extractJobrightListingDetails() {
  if (!isJobrightJobPage()) {
    return null;
  }

  const nextDataScript = document.querySelector("#__NEXT_DATA__");

  if (!nextDataScript?.textContent) {
    return null;
  }

  try {
    const nextData = JSON.parse(nextDataScript.textContent);
    const jobResult = nextData?.props?.pageProps?.dataSource?.jobResult;
    const locations = Array.isArray(jobResult?.jobLocations)
      ? jobResult.jobLocations.filter(Boolean)
      : [];

    return {
      workplaceType: normalizeJobrightWorkplaceType(
        jobResult?.workModel,
        jobResult?.isRemote,
      ),
      jobLocation:
        locations.join("; ") || jobResult?.jobLocation?.trim() || null,
      postedDateRaw:
        jobResult?.publishTimeDesc?.trim() ??
        jobResult?.publishTime?.trim() ??
        null,
    };
  } catch {
    return null;
  }
}

function normalizeJobrightWorkplaceType(workModel, isRemote) {
  const normalizedWorkModel = workModel?.trim().toLowerCase();

  if (normalizedWorkModel === "remote" || isRemote === true) {
    return "remote";
  }

  if (normalizedWorkModel === "hybrid") {
    return "hybrid";
  }

  if (
    normalizedWorkModel === "onsite" ||
    normalizedWorkModel === "on-site"
  ) {
    return "on-site";
  }

  return null;
}
