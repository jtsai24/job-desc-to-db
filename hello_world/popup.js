document.querySelector("#read-page").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const pageInfo = {
        title: document.title,
        heading: document.querySelector("h1")?.textContent?.trim(),
        url: window.location.href,
      };

      console.log("Job Page Reader:", pageInfo);
    },
  });
});
