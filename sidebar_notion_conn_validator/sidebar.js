// This prototype only stores a Notion token and tests the connection.

const JOB_DATA_SOURCE_ID = "3588d66b-99dd-8084-a239-000b69f0949f";

// Phase 1: find the sidebar elements used for input and output.
const tokenInput = document.querySelector("#notion-token");
const saveTokenButton = document.querySelector("#save-token");
const testNotionButton = document.querySelector("#test-notion");
const notionStatus = document.querySelector("#notion-status");

// Register the event handlers, then wait for the user to click a button.
saveTokenButton.addEventListener("click", saveNotionToken);
testNotionButton.addEventListener("click", testNotionConnection);

async function saveNotionToken() {
  const notionToken = tokenInput.value.trim();

  if (!notionToken) {
    notionStatus.textContent = "Enter a Notion token first.";
    return;
  }

  await browser.storage.local.set({ notionToken });

  tokenInput.value = "";
  notionStatus.textContent = "Token saved locally.";
}

async function testNotionConnection() {
  notionStatus.textContent = "Testing connection...";

  const { notionToken } = await browser.storage.local.get("notionToken");

  if (!notionToken) {
    notionStatus.textContent = "Save a Notion token first.";
    return;
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/data_sources/${JOB_DATA_SOURCE_ID}`,
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2026-03-11",
        },
      },
    );

    const responseBody = await response.json();

    if (!response.ok) {
      throw new Error(
        responseBody.message ?? `Notion returned status ${response.status}`,
      );
    }

    notionStatus.textContent = "Connected to the Job Application database.";
  } catch (error) {
    notionStatus.textContent = `Connection failed: ${error.message}`;
  }
}
