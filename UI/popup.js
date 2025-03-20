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
    
    const API_URL = "http://localhost:5000"; // Change if hosting backend online

    function toggleVisibility(showLogin) {
        loginContainer.style.display = showLogin ? "block" : "none";
        summarizerContainer.style.display = showLogin ? "none" : "block";
    }

    const token = localStorage.getItem("token");
    toggleVisibility(!token);

    function saveSummary(topic, link, summaryText) {
        let summaries = JSON.parse(localStorage.getItem("summaries")) || [];
        summaries.unshift({ topic, link, summaryText });
        localStorage.setItem("summaries", JSON.stringify(summaries));
    }

    function displayHistory() {
        let summaries = JSON.parse(localStorage.getItem("summaries")) || [];
        historyDiv.innerHTML = "";
        
        summaries.slice(0, 2).forEach(summary => {
            let summaryElement = document.createElement("div");
            summaryElement.innerHTML = `
                <p><strong>Topic:</strong> ${summary.topic}</p>
                <p><strong>Link:</strong> <a href="${summary.link}" target="_blank">${summary.link}</a></p>
                <p><strong>Summary:</strong> ${summary.summaryText}</p>
                <hr>
            `;
            historyDiv.appendChild(summaryElement);
        });
    }

    historyButton.addEventListener("click", displayHistory);

    async function authenticateUser(endpoint, credentials) {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
        });
        return response.json();
    }

    loginButton.addEventListener("click", async () => {
        const name = usernameInput.value;
        const password = passwordInput.value;
        
        const data = await authenticateUser("login", { name, password });
        if (data.token) {
            localStorage.setItem("token", data.token);
            toggleVisibility(false);
        } else {
            alert("Login Failed!");
        }
    });

    signupButton.addEventListener("click", async () => {
        const name = usernameInput.value;
        const password = passwordInput.value;
        
        const data = await authenticateUser("signup", { name, password });
        alert(data.message);
    });

    startButton.addEventListener("click", async () => {
        if (!token) {
            alert("Please login first!");
            return;
        }

        resultDiv.innerHTML = "";
        loadingDiv.style.display = "block";
        startButton.disabled = true;

        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (!tabs.length || !tabs[0].url) {
                loadingDiv.style.display = "none";
                startButton.disabled = false;
                return;
            }

            const topic = prompt("Enter the topic of the article:");
            try {
                const response = await fetch(`${API_URL}/summarize`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ url: tabs[0].url, max_words: maxWords.value }),
                });

                const data = await response.json();
                const summaryText = data.summary || "Error fetching summary";
                const wordCount = summaryText.split(' ').length;
                const readTime = Math.ceil(wordCount / 200);

                loadingDiv.style.display = "none";
                summaryDiv.innerHTML = `<p><strong>Summary:</strong> ${summaryText}</p>`;
                readTimeDiv.innerHTML = `<p><strong>Estimated Read Time:</strong> ${readTime} minute(s)</p>`;
                saveSummary(topic, tabs[0].url, summaryText);
            } catch (error) {
                loadingDiv.style.display = "none";
                resultDiv.innerHTML = `<p style='color: red;'>Failed to fetch summary: ${error.message}</p>`;
            } finally {
                startButton.disabled = false;
            }
        });
    });

    copyButton.addEventListener("click", () => {
        navigator.clipboard.writeText(summaryDiv.innerText).then(() => alert("Summary copied!"));
    });

    downloadButton.addEventListener("click", () => {
        const blob = new Blob([summaryDiv.innerText], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "summary.txt";
        a.click();
        URL.revokeObjectURL(a.href);
    });

    shareButton.addEventListener("click", () => {
        if (navigator.share) {
            navigator.share({ title: 'Summary', text: summaryDiv.innerText });
        } else {
            alert('Share API not supported.');
        }
    });

    maxWords.addEventListener("input", (event) => {
        document.getElementById("maxWordsValue").innerText = event.target.value;
    });
});