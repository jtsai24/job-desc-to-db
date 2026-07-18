function extractJobDescription() {
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
    captureMethod: "JobPosting description not found",
  };
}

extractJobDescription();
