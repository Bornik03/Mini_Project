document.getElementById("startButton").addEventListener("click", async () => {
    const resultDiv = document.getElementById("result");
    const loadingDiv = document.getElementById("loading");
  
    resultDiv.innerHTML = ""; // Clear previous results
    loadingDiv.style.display = "block"; // Show loading animation
  
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs.length === 0 || !tabs[0].url) return;
  
      try {
        const response = await fetch("http://10.5.25.141:5000/summarize", {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: tabs[0].url }),
        });
  
        const data = await response.json();
        const summaryText = data.summary || "Error fetching summary";
  
        // Hide loading and show summary
        loadingDiv.style.display = "none";
        resultDiv.innerHTML = `<p><strong>Summary:</strong> ${summaryText}</p>`;
  
      } catch (error) {
        loadingDiv.style.display = "none";
        resultDiv.innerHTML = "<p style='color: red;'>Failed to fetch summary.</p>";
      }
    });
  });  