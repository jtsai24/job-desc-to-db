// This sidebar uses event-driven programming and runs in two phases:
//
// Phase 1 — Setup:
// When the sidebar opens, find its HTML elements and register readPage as the
// function Firefox should call later. No webpage is read during this phase.
//
// Phase 2 — User action:
// When the user clicks "Read page", Firefox calls readPage. That function finds
// the active tab, reads information from its webpage, and displays the result.

// Phase 1: find the sidebar elements used for input and output.
const outputElement = document.querySelector("#result");
const readButton = document.querySelector("#read-page");

// Register the event handler, then wait for the user to click the button.
readButton.addEventListener("click", readPage);

// Phase 2: this function runs only after the click event occurs.
async function readPage() {
  outputElement.textContent = "Reading page...";

  try {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    const [{ result: pageInfo }] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        title: document.title,
        heading: document.querySelector("h1")?.textContent?.trim(),
        url: window.location.href,
      }),
    });

    outputElement.textContent = JSON.stringify(pageInfo, null, 2);
  } catch (error) {
    outputElement.textContent = `Could not read this page: ${error.message}`;
  }
}
