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
