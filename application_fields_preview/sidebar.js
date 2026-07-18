import { extractApplicationFields } from "./extract-application-fields.js";

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

    const [{ result: extractedFields }] =
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractApplicationFields,
      });

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
    statusElement.textContent = "Fields extracted.";
  } catch (error) {
    statusElement.textContent = `Could not read this page: ${error.message}`;
  }
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
  document.querySelector("#extraction-method").textContent =
    fields.extractionMethod || "Not found";
}
