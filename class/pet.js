// -------------------- Virtual Pet Setup --------------------
let messageTimeout; // Declare globally
let focusTime = 0; // Declare globally
let interval; // Declare globally for cleanup

document.addEventListener("DOMContentLoaded", () => {
    // Load messages and set up listeners
    loadMessages().then(messages => {
        console.log("Messages loaded:", messages);
        setupListeners(messages);
        // Call the function on page load
        checkTimeBasedMessage(messages);
    }).catch(err => console.error("Error loading messages:", err));

    // Initialize URL tracking and focus tracking
    startTracking();
    getCurrentURL();
    getNotes();
});


// -------------------- Event Listeners Setup --------------------
async function setupListeners(messages) {
    console.log("Setting up click listeners with messages:", messages);
    // Click Events
    for (const item of messages.click) {
        const elements = document.querySelectorAll(item.selector);
        let messageIndex = 0;
        
        elements.forEach(element => {
            element.addEventListener("click", () => {
                console.log(`Element clicked for selector ${item.selector}`);
                const message = item.text[messageIndex];
                console.log(`Showing message: ${message}`);
                showMessage(message);
                messageIndex = (messageIndex + 1) % item.text.length;
            });
        });
    }
}

// Add event listener for the button to generate notes
function getNotes(){
    const generateNotesButton = document.getElementById("menu-generate-notes");
    generateNotesButton.addEventListener("click", () => {
        showMessage("Generate Notes button clicked!");
        // Send message to content script to extract text
        chrome.runtime.sendMessage({ type: "extract_text" }, (response) => {
            console.log("Response from extract_text message:", response);
        });
    });
}


// -------------------- Load Messages from JSON --------------------
async function loadMessages() {
    try {
        const response = await fetch(chrome.runtime.getURL("pet_brain.json"));
        console.log(response);
        return await response.json();
    } catch (error) {
        console.error("Failed to load messages:", error);
        return {};
    }
}

// -------------------- Get Current URL --------------------
// Update the getCurrentURL function to handle initial page load
function getCurrentURL() {
    console.log("Setting up URL change listener");
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === "url_changed") {
            console.log("URL changed detected in pet.js:", request.url);
            showMessage("I noticed you changed pages! Let me know if you need help.");
            sendResponse({ status: "url change received" }); 
        }
    });
}

// -------------------- Display and Hide Messages --------------------
function showMessage(text) {
    const messageBox = document.getElementById("message-box");
    const messageText = document.getElementById("message-text");
    
    clearTimeout(messageTimeout);
    messageText.textContent = text;
    messageBox.style.display = "block";

    setTimeout(() => {
        messageBox.classList.add("show-message");
    }, 10);

    messageTimeout = setTimeout(hideMessage, 5500); // Auto-hide after 5.5s
}

function hideMessage() {
    const messageBox = document.getElementById("message-box");
    messageBox.classList.remove("show-message");
    setTimeout(() => {
        messageBox.style.display = "none";
    }, 500);
}

// -------------------- Detect User Focus --------------------
function startTracking() {
    console.log("Starting focus tracking");
    const focusCheckpoints = [
        { time: 180, message: "It's been 3 minutes! Need help generating notes?" },
        { time: 300, message: "5 minutes have passed! How about taking some notes?" },
        { time: 600, message: "You've been focused for 10 minutes! Great work!" }
    ];

    interval = setInterval(() => {
        focusTime += 1;
        for (const checkpoint of focusCheckpoints) {
            if (focusTime === checkpoint.time) {
                const messageBox = document.getElementById("message-box");
                messageBox.style.background = "linear-gradient(135deg, #4CAF50, #45a049)"; // Green gradient
                showMessage(checkpoint.message);
                setTimeout(() => {
                    messageBox.style.background = "linear-gradient(135deg, #ff9800, #ff5e62)"; // Reset to original
                }, 5000);
                break;
            }
        }
    }, 1000);
}

// Time-Based Greetings
function checkTimeBasedMessage(messages) {
    console.log("Checking time-based message");
    const now = new Date();
    const currentHour = now.getHours();
    let timeMessage = null;

    for (const item of messages.time) {
        const [start, end] = item.hour.split("-").map(Number);
        if (currentHour >= start && currentHour <= end) {
            timeMessage = item.text;
            break;
        }
    }

    if (timeMessage) {
        showMessage(timeMessage);
    }
}
