console.log("Content script loaded");

/**
 * Extract text content from the current page using Readability
 */
function extractPageText() {
  try {
    // Clone the current document since Readability modifies the DOM
    let clonedDoc = document.cloneNode(true);

    // Parse the article with Readability
    let article = new Readability(clonedDoc).parse();

    // If Readability fails, fallback to body text
    if (!article) {
      console.warn("Readability could not parse an article. Falling back to body text.");
      let fallbackText = document.body.innerText || "";
      return `URL: ${window.location.href}\n\nFallback text:\n${fallbackText}`;
    }

    // Build formatted output with article metadata and content
    let output = `
        URL: ${window.location.href}

        Title: ${article.title}
        Byline: ${article.byline || ""}
        Site Name: ${article.siteName || ""}
        Excerpt: ${article.excerpt || ""}
        Published Time: ${article.publishedTime || ""}
        Direction: ${article.dir || ""}
        Language: ${article.lang || ""}

        === EXTRACTED ARTICLE TEXT ===
        ${article.textContent}
        `;

    return output;

  } catch (error) {
    console.error("Readability extraction error:", error);
    return `Error extracting content: ${error.message}`;
  }
}

// Listen for extraction requests from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "ocr") {
    console.log("Readability extraction request received in content script.");
    
    // Send immediate response that we're processing
    sendResponse({ status: "Processing with Readability..." });

    // Extract and send the content
    const extractedContent = extractPageText();
    chrome.runtime.sendMessage({
      type: "save_text_file", 
      content: extractedContent
    }, () => console.log("✅ Sent extracted data to background.js"));

    return true;
  }
});

window.addEventListener("load", () => {
  const article = new Readability(document.cloneNode(true)).parse();
  if (article && article.textContent) {
    chrome.runtime.sendMessage({
      type: "summarize_content",
      content: article.textContent
    }, (response) => {
      if (response?.summary) {
        console.log("Gemini summary:", response.summary);
      } else {
        console.error("Gemini failed to summarize:", response?.error || "Unknown error");
      }
    });
  }
});
