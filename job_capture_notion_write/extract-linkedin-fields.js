// LinkedIn-specific field extraction helpers. Loaded before
// extract-application-fields.js by browser.scripting.executeScript, which
// runs the two files in the same execution context, so these top-level
// functions are callable from that file's coordinator.
function isLinkedInJobPage() {
  return (
    window.location.hostname.endsWith("linkedin.com") &&
    window.location.pathname.startsWith("/jobs/view/")
  );
}

function extractLinkedInWorkplaceType() {
  if (!isLinkedInJobPage()) {
    return null;
  }

  // Workplace type appears as one of its own badge pills alongside salary
  // and job-type pills, e.g. "$200K/yr - $400K/yr", "Remote", "Full-time".
  // Match the whole trimmed text of a pill, not a substring, so phrases
  // like "work with remote teams" in the description don't match.
  const badgeTexts = [...document.querySelectorAll("main button, main span")]
    .map((element) => element.textContent.trim());

  if (badgeTexts.includes("Remote")) return "remote";
  if (badgeTexts.includes("Hybrid")) return "hybrid";
  if (badgeTexts.includes("On-site") || badgeTexts.includes("Onsite")) {
    return "on-site";
  }

  return null;
}

function extractLinkedInPostedDateRaw() {
  if (!isLinkedInJobPage()) {
    return null;
  }

  // The posting-age text lives in the header row under the title, e.g.
  // "United States · 1 day ago · Over 100 people clicked apply". This is
  // a documented structural assumption, not a semantically labeled
  // field, so it is deliberately narrow: a leaf element whose whole text
  // is just the age phrase.
  const agoElement = [...document.querySelectorAll("main p, main span")].find(
    (element) =>
      element.children.length === 0 &&
      /\bago\s*$/i.test(element.textContent.trim()),
  );

  return agoElement?.textContent?.trim() ?? null;
}

function extractLinkedInCompany() {
  if (!isLinkedInJobPage()) {
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
