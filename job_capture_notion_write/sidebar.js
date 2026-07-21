import {
  createNotionApplication,
  createNotionJobDescription,
} from "./notion-client.js";

const extractButton = document.querySelector("#extract-fields");
const saveButton = document.querySelector("#save-to-notion");
const statusElement = document.querySelector("#status");

let reviewedApplicationFields = null;
let reviewedDescription = null;
let reviewedTabId = null;

extractButton.addEventListener("click", readPage);
saveButton.addEventListener("click", saveToNotion);

browser.tabs.onActivated.addListener((activeInfo) => {
  if (reviewedTabId !== null && activeInfo.tabId !== reviewedTabId) {
    invalidateReview();
  }
});

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (tabId === reviewedTabId && changeInfo.url) {
    invalidateReview();
  }
});

async function readPage() {
  reviewedApplicationFields = null;
  reviewedDescription = null;
  reviewedTabId = null;
  saveButton.disabled = true;
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

    reviewedApplicationFields = applicationFields;
    reviewedDescription = extractedDescription;
    reviewedTabId = tab.id;

    saveButton.disabled = false;
    statusElement.textContent =
      "Review the extracted fields, then save when they look correct.";
  } catch (error) {
    statusElement.textContent = `Could not read this page: ${error.message}`;
  }
}

async function saveToNotion() {
  if (!reviewedApplicationFields || !reviewedDescription) {
    statusElement.textContent = "Extract and review a page before saving.";
    return;
  }

  saveButton.disabled = true;
  statusElement.textContent = "Checking Notion token...";

  try {
    const storedValues = await browser.storage.local.get("notionToken");
    const notionToken = storedValues.notionToken;

    if (!notionToken) {
      statusElement.textContent =
        "Cannot save: Notion token is missing from browser storage.";
      saveButton.disabled = false;
      return;
    }

    statusElement.textContent = "Saving to Notion...";

    const notionPage = await createNotionApplication(
      notionToken,
      reviewedApplicationFields,
    );

    statusElement.textContent = "Saving job description...";

    await createNotionJobDescription(
      notionToken,
      notionPage.id,
      reviewedDescription.jobDescription,
    );

    statusElement.textContent = "Saved to Notion: ";

    const notionPageLink = document.createElement("a");
    notionPageLink.href = notionPage.url;
    notionPageLink.textContent = notionPage.url;
    notionPageLink.target = "_blank";
    notionPageLink.rel = "noopener noreferrer";

    statusElement.append(notionPageLink);

    reviewedApplicationFields = null;
    reviewedDescription = null;
    reviewedTabId = null;
  } catch (error) {
    statusElement.textContent = `Could not save to Notion: ${error.message}`;
    saveButton.disabled = false;
  }
}

function invalidateReview() {
  reviewedApplicationFields = null;
  reviewedDescription = null;
  reviewedTabId = null;
  saveButton.disabled = true;
  statusElement.textContent =
    "The active page changed. Extract and review it before saving.";
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
