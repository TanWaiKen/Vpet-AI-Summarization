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

        case "summarize_content":
            const API_KEY = "AIzaSyBMJZ_0i1k8Yavmr69IM7BYwXforgN-_6I"; //Gemini API Key

            if (!request.content) {
                sendResponse({ error: "No content to summarize." });
                return;
            }

            fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + API_KEY, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Analyze this webpage content and provide a concise summary in paragraph form: ${request.content}`
                        }]
                    }]
                })
            })
                .then(res => res.json())
                .then(data => {
                    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "No summary available.";
                    sendResponse({ summary: result });
                })
                .catch(err => {
                    console.error("Gemini error:", err);
                    sendResponse({ error: "Failed to summarize content." });
                });

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
