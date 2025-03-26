// Add event listener for the "Extract Content" button
document.getElementById('extract').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Inject Readability.js into the webpage
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['Readability.js']
  });

  // Inject and run the extraction script
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractPageText
  }, (results) => {
    if (results && results[0] && results[0].result) {
      const content = results[0].result;
      document.getElementById('content').value = content;
    } else {
      document.getElementById('content').value = "Error: Unable to extract content.";
    }
  });
});
  
// Existing code for summarization
document.getElementById('summarize').addEventListener('click', async () => {
    document.getElementById('loader').style.display = 'block';
    document.getElementById('summary').value = ''; // Clear previous summary

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractPageText
    }, async (results) => {
      const text = results[0].result;
      const summary = await fetchSummary(text);

      // After fetching the summary:
      document.getElementById('loader').style.display = 'none';
      document.getElementById('summary').value = summary; // For <textarea>
      //document.getElementById('summary').innerText = summary; // For <div>

      document.getElementById('copy').addEventListener('click', () => {
        const summary = document.getElementById('summary').value;
        navigator.clipboard.writeText(summary).then(() => {
          alert("Summary copied to clipboard!");
        });
      });
      
    });
  });
  
  async function fetchSummary(text) {
    try {
      const response = await fetch('http://localhost:5000/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text })
      });
      const data = await response.json();
      return data.summary;
    } catch (error) {
      console.error("Error fetching summary:", error);
      return "Error: Unable to fetch summary.";
    }
  }
  
  function extractPageText() {
    try {
      const documentClone = document.cloneNode(true);
      const article = new Readability(documentClone).parse();
      return article ? article.textContent : "Error: Unable to extract content.";
    } catch (error) {
      console.error("Error extracting content:", error);
      return "Error: Unable to extract content.";
    }
  }