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
    const historyButton = document.getElementById("historyButton");
    const historyDiv = document.getElementById("history");
    const copyButton = document.getElementById("copyButton");
    const downloadButton = document.getElementById("downloadButton");
    const shareButton = document.getElementById("shareButton");
    const maxWords = document.getElementById("maxWords");
    const logoutButton = document.getElementById("logoutButton");
    const darkModeToggle = document.getElementById("dark-mode-toggle");

    toggleActionButtons(false);

    const API_URL = "http://localhost:5000"; // Base API URL

    function toggleActionButtons(show) {
        const action = show ? 'block' : 'none';
        copyButton.style.display = action;
        downloadButton.style.display = action; 
        shareButton.style.display = action;
    }

    function toggleVisibility(showLogin) {
        loginContainer.style.display = showLogin ? "block" : "none";
        summarizerContainer.style.display = showLogin ? "none" : "block";
        toggleActionButtons(false);
    }

    function getToken() {
        return localStorage.getItem("token");
    }

    toggleVisibility(!getToken());

    function saveSummary(topic, link, summaryText) {
        let summaries = JSON.parse(localStorage.getItem("summaries")) || [];
        summaries.unshift({ topic, link, summaryText });
        localStorage.setItem("summaries", JSON.stringify(summaries));
    }

    async function fetchHistoryFromDB() {
        try {
            const token = getToken();
            if (!token) {
                console.log('No token found in localStorage');
                return [];
            }
            
            const response = await fetch(`${API_URL}/getSummaries`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${errorText}`);
            }
    
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching history:", error);
            return [];
        }
    }

    async function displayHistory() {
        historyDiv.innerHTML = "<p>Loading history...</p>";
        
        try {
            const dbSummaries = await fetchHistoryFromDB();
            
            historyDiv.innerHTML = "";
            
            if (!dbSummaries || dbSummaries.length === 0) {
                historyDiv.innerHTML = "<p>No history found</p>";
                return;
            }
    
            const container = document.createElement("div");
            container.className = "history-container";
            
            dbSummaries.forEach(summary => {
                const summaryElement = document.createElement("div");
                summaryElement.className = "summary-item";
                summaryElement.innerHTML = `
                    <h3>${summary.topic || 'No title'}</h3>
                    <p class="summary-link"><a href="${summary.link}" target="_blank">View Original</a></p>
                    <div class="summary-text">${summary.text}</div>
                    <small>${new Date(summary.createdAt).toLocaleString()}</small>
                    <hr>
                `;
                container.appendChild(summaryElement);
            });
            
            historyDiv.appendChild(container);
            historyDiv.style.display = "block";
        } catch (error) {
            console.error("Error displaying history:", error);
            historyDiv.innerHTML = `<p class="error">Error loading history</p>`;
        }
    }

    historyButton.addEventListener("click", () => {
        toggleActionButtons(false);
        displayHistory();
    });

    async function authenticateUser(endpoint, credentials) {
        try {
            const response = await fetch(`${API_URL}/${endpoint}`, {
                method: "POST",
                mode: "cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials),
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Authentication error:", error);
            return { error: "Network error. Try again later." };
        }
    }

    loginButton.addEventListener("click", async () => {
        const name = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!name || !password) {
            alert("Please enter both username and password.");
            return;
        }

        const data = await authenticateUser("login", { name, password });

        if (data.token) {
            localStorage.setItem("token", data.token);
            toggleVisibility(false);
            alert("Login successful!");
        } else {
            alert("Login Failed! " + (data.message || "Unknown error"));
        }
    });

    signupButton.addEventListener("click", async () => {
        const name = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!name || !password) {
            alert("Please enter both username and password.");
            return;
        }

        const data = await authenticateUser("signup", { name, password });
        alert(data.message);
    });

    startButton.addEventListener("click", async () => {
        const token = getToken();
    
        if (!token) {
            alert("Please login first!");
            return;
        }
    
        resultDiv.innerHTML = "";
        loadingDiv.style.display = "block";
        startButton.disabled = true;
    
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                if (!tabs.length || !tabs[0].url) {
                    loadingDiv.style.display = "none";
                    startButton.disabled = false;
                    alert("No active tab found.");
                    return;
                }
    
                let topic = prompt("Enter the topic of the article:");
                if (!topic) {
                    alert("Topic is required.");
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
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ url: tabs[0].url, max_words: maxWords.value }),
                    });
    
                    if (!response.ok) {
                        throw new Error(`Server responded with status ${response.status}`);
                    }
    
                    const data = await response.json();
                    const summaryText = data.summary || "Error fetching summary";
                    const wordCount = summaryText.split(' ').length;
                    const readTime = Math.ceil(wordCount / 200);
    
                    loadingDiv.style.display = "none";
                    summaryDiv.innerHTML = `<p><strong>Summary:</strong> ${summaryText}</p>`;
                    readTimeDiv.innerHTML = `<p><strong>Estimated Read Time:</strong> ${readTime} minute(s)</p>`;
    
                    toggleActionButtons(true);
    
                    const saveResponse = await fetch(`${API_URL}/saveSummary`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            topic,
                            link: tabs[0].url,
                            text: summaryText
                        }),
                    });
    
                    if (!saveResponse.ok) {
                        throw new Error("Failed to save summary to database");
                    }
    
                } catch (error) {
                    loadingDiv.style.display = "none";
                    resultDiv.innerHTML = `<p style='color: red;'>Error: ${error.message}</p>`;
                    toggleActionButtons(false);
                } finally {
                    startButton.disabled = false;
                }
            });
        } catch (error) {
            console.error("Error accessing Chrome tabs:", error);
            alert("This extension may not be running in a Chrome extension environment.");
            loadingDiv.style.display = "none";
            startButton.disabled = false;
        }
    });

    copyButton.addEventListener("click", () => {
        navigator.clipboard.writeText(summaryDiv.innerText)
            .then(() => alert("Summary copied!"))
            .catch(err => console.error("Failed to copy text:", err));
    });

    downloadButton.addEventListener("click", () => {
        const blob = new Blob([summaryDiv.innerText], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "summary.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    });

    shareButton.addEventListener("click", () => {
        if (navigator.share) {
            navigator.share({ title: 'Summary', text: summaryDiv.innerText })
                .catch(err => console.error("Share failed:", err));
        } else {
            alert('Share API not supported.');
        }
    });

    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("token");
        toggleVisibility(true);
        toggleActionButtons(false);
        alert("Logged out successfully!");
        window.location.reload();
    });

    maxWords.addEventListener("input", (event) => {
        document.getElementById("maxWordsValue").innerText = event.target.value;
    });

    const isDarkMode = localStorage.getItem("darkMode") === "true";
    if (isDarkMode) document.body.classList.add("dark-mode");

    darkModeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
    });
});