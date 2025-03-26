// Listen for OCR service messages and forward them
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background message received:", request);

    switch (request.type) {
        case "extract_text":
            // Forward request to content script
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {type: "ocr"}, function(response) {
                    console.log("OCR response:", response);
                });
            });
            return true; // Keep message channel open for async response

        case "save_text_file":
            if (!request.content) {
                sendResponse({ error: "No content provided to save." });
                return;
            }

            // Convert the text content into a .txt Blob, then to a data URL
            const blob = new Blob([request.content], { type: "text/plain" });
            const reader = new FileReader();
            
            reader.onload = function () {
                const dataUrl = reader.result;
                chrome.downloads.download({
                    url: dataUrl,
                    filename: "notes.txt",
                });
            };

            reader.onerror = function (err) {
                sendResponse({ error: err.message });
            };

            // This starts reading the blob as a data URL
            reader.readAsDataURL(blob);

            // Return true to indicate we'll send an async response
            return true;

        default:
            console.warn("Unknown request type:", request.type);
            sendResponse({ error: "Invalid request type." });
            return;
    }
});


// Detect tab updates (URL changes, reloads)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        notifyPetScript(tabId, tab.url);
    }
});

// Detect newly created tabs
chrome.tabs.onCreated.addListener((tab) => {
    notifyPetScript(tab.id, tab.url);
});


// Function to send the URL to pet.js
function notifyPetScript(tabId, url) {
    console.log("notifyPetScript called with tabId:", tabId, "and URL:", url);
    if (!tabId || !url) return; // Ensure valid tabId and URL

    // Ensure URL is valid (only HTTP or HTTPS)
    if ((url.startsWith("http://") || url.startsWith("https://")) && !url.startsWith("https://www.google.com/")) {

        // Send URL to pet.js
        chrome.runtime.sendMessage({
            type: "url_changed",
            url: url
        });
    } else {
        console.warn(`Skipping notification for non-HTTP/HTTPS URL: ${url}`);
    }
}
