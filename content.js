// console.log("Content script loaded");


console.log("Content script loaded");

// Listen for messages from the background or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "ocr") {
    console.log("Readability extraction request received in content script.");
    // Send a quick response to let the sender know we're working
    sendResponse({ status: "Processing with Readability..." });

    // Run Readability extraction
    runReadabilityExtraction();

    // Returning true lets Chrome know we'll send an async response if needed
    return true;
  }
});

/**
 * Run Mozilla's Readability on the current page and send results to background.js
 */
function runReadabilityExtraction() {
  try {
    // Clone the current document, because Readability modifies the DOM
    let clonedDoc = document.cloneNode(true);

    // Use the Readability constructor
    // (Assumes that Readability is already available in the global scope;
    //  if you are loading it via an import or require, adjust accordingly.)
    let article = new Readability(clonedDoc).parse();

    // If Readability can’t find a decent article, fallback to body text
    if (!article) {
      console.warn("Readability could not parse an article. Fallback to body text.");
      let fallbackText = document.body.innerText || "";
      chrome.runtime.sendMessage(
        {
          type: "save_text_file",
          content: `URL: ${window.location.href}\n\nFallback text:\n${fallbackText}`
        },
        () => console.log("✅ Sent fallback text to background.js")
      );
      return;
    }

    // Build a simple text output
    // You can include `article.content` (HTML) or `article.textContent` (plain text).
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

        === (Optional) HTML Content ===
        ${article.content}
        `;

    // Send the extracted data to the background script
    chrome.runtime.sendMessage(
      {
        type: "save_text_file",
        content: output
      },
      () => console.log("✅ Sent extracted data to background.js")
    );

  } catch (error) {
    console.error("Readability extraction error:", error);
  }
}
// // Register the OCR message listener immediately
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.type === "ocr") {
//         console.log("OCR request received in content script");
//         // Send an immediate response
//         sendResponse({ status: "Processing with OCR..." });
//         // Load Tesseract and run OCR
//         loadTesseractAndRunOCR();
//         return true; // Keep the channel open for asynchronous response if needed
//     }
// });

// // 1️⃣ Function to load Tesseract.js only when needed
// function loadTesseractAndRunOCR(){
//     if (isTesseractLoaded){
//         console.log("Tesseract.js Ready! Now OCR can run.");
//         runOCR();
//         return;
//     }

//     let script = document.createElement("script");
//     script.src = chrome.runtime.getURL("libs/tesseract.min.js");
//     console.log("Loading Tesseract.js from:", script.src);

//     script.onload = function() {
//         console.log("Tesseract.js Loaded!");
//         isTesseractLoaded = true;
//         runOCR();
//     };

//     document.head.appendChild(script);
// }

// // 2️⃣ Function to run OCR (unchanged)
// function runOCR() {
//     try {
//         let pageText = document.body.innerText.trim();
//         let currentURL = window.location.href;
//         console.log("Page URL:", currentURL);
//         let imgElements = document.querySelectorAll("img");

//         let imgURLs = [];
//         let extractedTexts = [];
//         let processedImages = 0;
//         let failedImages = 0;

//         // Filter out small images and data URLs
//         for (const img of imgElements) {
//             if (img.width > 50 && img.height > 50 && !img.src.startsWith('data:')) {
//                 imgURLs.push(img.src);
//             }
//         }

//         console.log("Found valid image URLs:", imgURLs);

//         if (imgURLs.length === 0) {
//             console.log("No valid images found. Sending page text only.");
//             chrome.runtime.sendMessage({
//                 type: "save_text_file",
//                 content: `URL: ${currentURL}\n\nText:\n${pageText}`
//             }, () => console.log("✅ Sent page text to background.js"));
//             return;
//         }

//         // Process images using Tesseract.js
//         for (let i = 0; i < imgURLs.length; i++) {
//             const imgURL = imgURLs[i];
//             console.log(`Processing image ${i + 1}: ${imgURL}`);
//             Tesseract.recognize(
//                 imgURL, 'eng',
//                 { 
//                     logger: m => console.log(`Processing image ${i + 1}: ${m.status}`),
//                     errorHandler: e => console.error(`Error processing image ${i + 1}:`, e)
//                 }
//             ).then(({ data: { text } }) => {
//                 if (text.trim()) {
//                     console.log(`OCR result for image ${i + 1}:`, text);
//                     extractedTexts.push(`Image ${i + 1}: ${imgURL}\nText:\n${text.trim()}\n`);
//                 }
//             }).catch(error => {
//                 console.error(`Failed to process image ${i + 1}:`, error);
//                 failedImages++;
//                 extractedTexts.push(`Image ${i + 1}: ${imgURL}\nOCR failed: ${error.message}\n`);
//             }).finally(() => {
//                 processedImages++;
//                 if (processedImages === imgURLs.length) {
//                     console.log("All images processed. Sending extracted text file.");
//                     let fullText = `URL: ${currentURL}\n\nPage Text:\n${pageText}\n\nExtracted from Images (${imgURLs.length - failedImages}/${imgURLs.length} successful):\n${extractedTexts.join("\n")}`;
                    
//                     chrome.runtime.sendMessage({
//                         type: "save_text_file",
//                         content: fullText
//                     }, () => console.log("✅ Sent extracted data to background.js"));
//                 }
//             });
//         }
//     } catch (error) {
//         console.error("Extraction error:", error);
//     }
// }
