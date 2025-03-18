document.addEventListener("DOMContentLoaded", () => {
    const resultDiv = document.getElementById("result");
    const loadingDiv = document.getElementById("loading");
    const summaryDiv = document.getElementById("summary");
    const readTimeDiv = document.getElementById("readTime");
    const copyButton = document.getElementById("copyButton");
    const downloadButton = document.getElementById("downloadButton");
    const shareButton = document.getElementById("shareButton");
    const maxWords = document.getElementById("maxWords");
    const startButton = document.getElementById("startButton");

    startButton.addEventListener("click", async () => {
        resultDiv.innerHTML = ""; // Clear previous results
        summaryDiv.innerHTML = "Click 'Summarize' to summarize the news."; // Reset summary text
        readTimeDiv.innerHTML = ""; // Clear previous read time
        loadingDiv.style.display = "block"; // Show loading animation
        copyButton.style.display = "none"; // Hide copy button
        downloadButton.style.display = "none"; // Hide download button
        shareButton.style.display = "none"; // Hide share button
        startButton.disabled = true; // Disable the start button

        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs.length === 0 || !tabs[0].url) {
                loadingDiv.style.display = "none";
                startButton.disabled = false; // Enable the start button
                return;
            }

            try {
                const response = await fetch("http://10.5.25.152:5000/summarize", {
                    method: "POST",
                    mode: "cors",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: tabs[0].url, max_words: maxWords.value }),
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.statusText}`);
                }

                const data = await response.json();
                const summaryText = data.summary || "Error fetching summary";

                // Calculate read time
                const wordCount = summaryText.split(' ').length;
                const readTime = Math.ceil(wordCount / 200); // Assuming an average reading speed of 200 words per minute

                // Hide loading and show summary and read time
                loadingDiv.style.display = "none";
                summaryDiv.innerHTML = `<p><strong>Summary:</strong> ${summaryText}</p>`;
                readTimeDiv.innerHTML = `<p><strong>Estimated Read Time:</strong> ${readTime} minute(s)</p>`;
                copyButton.style.display = "block"; // Show copy button
                downloadButton.style.display = "block"; // Show download button
                shareButton.style.display = "block"; // Show share button
                startButton.disabled = false; // Enable the start button

            } catch (error) {
                loadingDiv.style.display = "none";
                resultDiv.innerHTML = `<p style='color: red;'>Failed to fetch summary: ${error.message}</p>`;
                startButton.disabled = false; // Enable the start button
            }
        });
    });

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;
    const html = document.documentElement;

    // Check local storage for dark mode preference
    chrome.storage.sync.get('darkMode', function(data) {
        if (data.darkMode === 'enabled') {
            html.classList.add('dark-mode');
            body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️ Light Mode';
        } else {
            html.classList.remove('dark-mode');
            body.classList.remove('dark-mode');
            darkModeToggle.textContent = '🌙 Dark Mode';
        }
    });

    // Toggle Dark Mode
    darkModeToggle.addEventListener('click', function () {
        if (html.classList.contains('dark-mode')) {
            html.classList.remove('dark-mode');
            body.classList.remove('dark-mode');
            darkModeToggle.textContent = '🌙 Dark Mode';
            chrome.storage.sync.set({ 'darkMode': 'disabled' });
        } else {
            html.classList.add('dark-mode');
            body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️ Light Mode';
            chrome.storage.sync.set({ 'darkMode': 'enabled' });
        }
    });

    maxWords.addEventListener("input", (event) => {
        document.getElementById("maxWordsValue").innerText = event.target.value;
    });

    copyButton.addEventListener("click", () => {
        const summaryText = summaryDiv.innerText;
        navigator.clipboard.writeText(summaryText).then(() => {
            alert("Summary copied to clipboard!");
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    });

    downloadButton.addEventListener("click", () => {
        const summaryText = summaryDiv.innerText;
        const blob = new Blob([summaryText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "summary.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    shareButton.addEventListener("click", () => {
        const summaryText = summaryDiv.innerText;
        if (navigator.share) {
            navigator.share({
                title: 'News Summary',
                text: summaryText,
            }).then(() => {
                console.log('Summary shared successfully');
            }).catch(err => {
                console.error('Error sharing summary: ', err);
            });
        } else {
            alert('Share API not supported in this browser.');
        }
    });
});