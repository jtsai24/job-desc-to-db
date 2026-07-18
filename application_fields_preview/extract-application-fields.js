// Firefox runs this function inside the active job webpage.
export function extractApplicationFields() {
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
          extractionMethod: "JobPosting structured data",
        };
      }
    } catch {
      // Continue if this script does not contain valid JSON-LD.
    }
  }

  const titleParts = document.title
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    jobTitle:
      document.querySelector("h1")?.textContent?.trim() ??
      titleParts[0] ??
      null,
    company: titleParts.length > 1 ? titleParts.at(-1) : null,
    url: window.location.href,
    extractionMethod: "Page fallback rules",
  };
}
