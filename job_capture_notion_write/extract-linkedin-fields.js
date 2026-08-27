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

// The posting-age text lives in the header row under the title, alongside
// the location and applicant count, e.g.
// "United States · 1 day ago · Over 100 people clicked apply". This is a
// documented structural assumption, not a semantically labeled field, so
// it is deliberately narrow: a leaf element whose whole text is just the
// age phrase. Both the posted-date and location extractors anchor to this
// same row so they read from the current job, not an unrelated one.
//
// Confirmed markup nests the age text a level deeper than the location and
// applicant-count text, e.g. <span><strong>Reposted 2 hours ago</strong>
// </span>. Searching "main *" rather than just "main p, main span" is what
// picks up that <strong> leaf.
//
// On search-results pages the DOM also contains other job cards (a list
// rail, "similar jobs," etc.), each with their own "ago" text, sometimes
// rendered before the current job's own detail pane. Anchoring to the
// current job's title (h1) and taking the first "ago" candidate that
// follows it in document order keeps this scoped to the current job.
function findLinkedInPostingAgeElement() {
  const titleElement = document.querySelector("h1");
  const candidates = [...document.querySelectorAll("main *")].filter(
    (element) =>
      element.children.length === 0 &&
      /\bago\s*$/i.test(element.textContent.trim()),
  );

  if (!titleElement) {
    return candidates[0];
  }

  for (const candidate of candidates) {
    const position = titleElement.compareDocumentPosition(candidate);
    const candidateIsAfterTitle = position & Node.DOCUMENT_POSITION_FOLLOWING;

    if (candidateIsAfterTitle) {
      return candidate;
    }
  }

  return undefined;
}

function extractLinkedInPostedDateRaw() {
  if (!isLinkedInJobPage()) {
    return null;
  }

  return findLinkedInPostingAgeElement()?.textContent?.trim() ?? null;
}

function extractLinkedInJobLocation() {
  if (!isLinkedInJobPage()) {
    return null;
  }

  // Confirmed markup wraps the row in a <p>, with the age text nested a
  // level deeper (see findLinkedInPostingAgeElement). Climb to the nearest
  // <p> ancestor rather than taking .parentElement, so this lands on the
  // shared row instead of the age text's own narrow wrapper span.
  const metaRow = findLinkedInPostingAgeElement()?.closest("p");

  if (!metaRow) {
    return null;
  }

  // The location is the first leaf sibling in the same row as the posting
  // age, e.g. "San Mateo, CA · 2 days ago · 93 people clicked apply". Even
  // remote listings show a location here (e.g. "United States").
  const firstLeafSibling = [...metaRow.children].find(
    (element) => element.children.length === 0 && element.textContent.trim(),
  );

  return firstLeafSibling?.textContent?.trim() ?? null;
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
