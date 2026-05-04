safeURL = false;

document.addEventListener("DOMContentLoaded", () => {
    setupNotesGeneration();
});


// -------------------- Note Generation --------------------
function setupNotesGeneration() {
    const generateNotesButton = document.getElementById("menu-generate-notes");
    if (!generateNotesButton) return;
    
    generateNotesButton.addEventListener("click", generateNotes);
}

async function generateNotes() {
    
    if (window.safeURL === false) {
        messageBox.style.background = "linear-gradient(135deg, #f44336, #e91e63)";
        showMessage("Note generation is disabled on this page.");
        return;
    }
    messageBox.style.background = "linear-gradient(135deg, #4CAF50, #45a049)";
    showMessage("Generating notes... Please wait.");

    // Extract text from current page
    chrome.runtime.sendMessage({ type: "note" }, async (response) => {
        if (!response || !response.text) {
            showMessage("Error: No text was extracted from the page.");
            return;
        }

        const prompt = `Summarize the content into a topic followed by its main points. 
                        Use plain text only (no formatting or styling). 
                        Keep the summary under 200 words.`;


        // Call Gemini API
        try {
            const result = await callGeminiAPI(response.text + prompt);
            showMessage("Notes generated successfully!");
            // Here you would typically display or save the notes
            console.log("Generated notes:", result);

            chrome.runtime.sendMessage({
                type: "save_text_file", 
                content: result.text
              }, () => console.log("✅ Sent extracted data to background.js"));

            console.log(result.tokenUsage.totalTokens);

        } catch (error) {
            showMessage("Error generating notes. Please try again.");
            console.error("API Error:", error);
        }

    });
}


async function callGeminiAPI(text) {
    const API_KEY = "AIzaSyBuE1Ul1suqE8UlA3FoOdGPEAV2aF6evVg";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

    const requestBody = {
        contents: [
            {
            parts: [
                {
                text: text
                }
            ]
            }
        ]
    };

    try{
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": API_KEY
            },
            body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
            throw new Error(`API response: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Gemini response:", data);

        const result = {
            text: data.candidates?.[0]?.content?.parts?.[0]?.text || "No text found in response",
            tokenUsage: {
              promptTokens: data.usageMetadata?.promptTokenCount || 0,
              responseTokens: data.usageMetadata?.candidatesTokenCount || 0,
              totalTokens: data.usageMetadata?.totalTokenCount || 0
            }
        };

        return result;

    } catch (error) {
        console.error("Error:", error);
        throw error;
    }

}



