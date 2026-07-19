function captureJobDescription() {
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

  const linkedInDescription = readLinkedInAboutTheJob();

  if (linkedInDescription) {
    return linkedInDescription;
  }

  return {
    jobDescription: null,
    captureMethod: "Job description not found",
  };
}

function readLinkedInAboutTheJob() {
  const isLinkedInJobPage =
    window.location.hostname.endsWith("linkedin.com") &&
    window.location.pathname.startsWith("/jobs/view/");

  if (!isLinkedInJobPage) {
    return null;
  }

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

captureJobDescription();
