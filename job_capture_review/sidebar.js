const extractButton = document.querySelector("#extract-fields");
const statusElement = document.querySelector("#status");

extractButton.addEventListener("click", readPage);

async function readPage() {
  statusElement.textContent = "Reading page...";

  try {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    const scriptResults = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["extract-application-fields.js"],
    });

    const firstScriptResult = scriptResults[0];
    const extractedFields = firstScriptResult.result;

    const descriptionScriptResults =
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["extract-job-description.js"],
      });

    const firstDescriptionResult = descriptionScriptResults[0];
    const extractedDescription = firstDescriptionResult.result;

    const dateFirstSeen = new Date().toLocaleDateString("en-CA");
    const applicationFields = {
      ...extractedFields,
      dateFirstSeen,
      source: new URL(extractedFields.url).hostname,
      jobType: "full time",
      status: "prepare to apply",
      sortId: `${dateFirstSeen} | ${extractedFields.company ?? ""} | ${extractedFields.jobTitle ?? ""}`,
    };

    displayApplicationFields(applicationFields);
    displayJobDescription(extractedDescription);
    statusElement.textContent = "Fields extracted.";
  } catch (error) {
    statusElement.textContent = `Could not read this page: ${error.message}`;
  }
}

function displayJobDescription(description) {
  document.querySelector("#description-capture-method").textContent =
    description.captureMethod || "Not found";

  document.querySelector("#job-description").textContent =
    description.jobDescription || "Not found";
}

// These explicit assignments make every value-to-HTML mapping visible.
function displayApplicationFields(fields) {
  document.querySelector("#job-title").textContent =
    fields.jobTitle || "Not found";
  document.querySelector("#company").textContent =
    fields.company || "Not found";
  document.querySelector("#job-url").textContent =
    fields.url || "Not found";
  document.querySelector("#date-first-seen").textContent =
    fields.dateFirstSeen || "Not found";
  document.querySelector("#source").textContent =
    fields.source || "Not found";
  document.querySelector("#job-type").textContent =
    fields.jobType || "Not found";
  document.querySelector("#application-status").textContent =
    fields.status || "Not found";
  document.querySelector("#sort-id").textContent =
    fields.sortId || "Not found";
  document.querySelector("#capture-method").textContent =
    fields.captureMethod || "Not found";
}
