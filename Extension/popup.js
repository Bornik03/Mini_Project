document.addEventListener("DOMContentLoaded", function () {
    const loginContainer = document.getElementById("login-container");
    const summarizerContainer = document.getElementById("summarizer");

    const loginButton = document.getElementById("loginButton");
    const signupButton = document.getElementById("signupButton");
    const startButton = document.getElementById("startButton");

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    const resultDiv = document.getElementById("result");
    const loadingDiv = document.getElementById("loading");
    const summaryDiv = document.getElementById("summary");
    const readTimeDiv = document.getElementById("readTime");
    const copyButton = document.getElementById("copyButton");
    const downloadButton = document.getElementById("downloadButton");
    const shareButton = document.getElementById("shareButton");
    const maxWords = document.getElementById("maxWords");

    const API_URL = "http://localhost:5000"; // Change if hosting backend online

    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (token) {
        loginContainer.style.display = "none";
        summarizerContainer.style.display = "block";
    }

    // Login function
    loginButton.addEventListener("click", async () => {
        const name = usernameInput.value;
        const password = passwordInput.value;

        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, password }),
        });

        const data = await response.json();
        if (data.token) {
            localStorage.setItem("token", data.token);
            loginContainer.style.display = "none";
            summarizerContainer.style.display = "block";
        } else {
            alert("Login Failed!");
        }
    });

    // Signup function
    signupButton.addEventListener("click", async () => {
        const name = usernameInput.value;
        const password = passwordInput.value;

        const response = await fetch(`${API_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, password }),
        });

        const data = await response.json();
        alert(data.message);
    });

    // Prevent Summarization if not logged in
    startButton.addEventListener("click", async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Please login first!");
            return;
        }

        resultDiv.innerHTML = "";
        summaryDiv.innerHTML = "Click 'Summarize' to summarize the news.";
        readTimeDiv.innerHTML = "";
        loadingDiv.style.display = "block";
        copyButton.style.display = "none";
        downloadButton.style.display = "none";
        shareButton.style.display = "none";
        startButton.disabled = true;

        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs.length === 0 || !tabs[0].url) {
                loadingDiv.style.display = "none";
                startButton.disabled = false;
                return;
            }

            try {
                const response = await fetch(`${API_URL}/summarize`, {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}` // Send token in request
                    },
                    body: JSON.stringify({ url: tabs[0].url, max_words: maxWords.value }),
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.statusText}`);
                }

                const data = await response.json();
                const summaryText = data.summary || "Error fetching summary";

                const wordCount = summaryText.split(' ').length;
                const readTime = Math.ceil(wordCount / 200);

                loadingDiv.style.display = "none";
                summaryDiv.innerHTML = `<p><strong>Summary:</strong> ${summaryText}</p>`;
                readTimeDiv.innerHTML = `<p><strong>Estimated Read Time:</strong> ${readTime} minute(s)</p>`;
                copyButton.style.display = "block";
                downloadButton.style.display = "block";
                shareButton.style.display = "block";
                startButton.disabled = false;

            } catch (error) {
                loadingDiv.style.display = "none";
                resultDiv.innerHTML = `<p style='color: red;'>Failed to fetch summary: ${error.message}</p>`;
                startButton.disabled = false;
            }
        });
    });

    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;
    const html = document.documentElement;

    chrome.storage.sync.get('darkMode', function (data) {
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
