# News Summarizer

## Overview

The News Summarizer is a web application and browser extension that allows users to summarize news articles from any URL. This tool is designed to help users quickly get the main points of an article without having to read the entire text. It features user authentication, a history of summarized articles, and the ability to customize the summary length.

## Features

* **Article Summarization**: Summarizes news articles using a machine learning model.
* **User Authentication**: Users can sign up and log in to their accounts.
* **Summarization History**: Keeps a history of all the articles a user has summarized.
* **Customizable Summary Length**: Allows users to set the maximum number of words for the summary.
* **Browser Extension**: A convenient browser extension to summarize articles directly from the news page.
* **Dark Mode**: A dark mode option for the user interface.
* **Export Options**: Users can copy, download, or share the generated summary.

## Project Structure

The project is divided into several components:

* **Backend**: Contains the server-side code, including the API for summarization, user authentication, and database management. There are two backend implementations: one in Python with Flask and SQLite (`Backend/all_in_one.py`), and another in Node.js with Express and MongoDB (`Backend/news-auth-backend/server.js`).
* **ML Model**: Includes the machine learning model for text summarization. The model is built using the Hugging Face Transformers library (`ML Model/mini_project.py`).
* **UI**: The user interface for the web application and the browser extension popup, built with HTML, CSS, and JavaScript. A React-based UI is also included (`UI/App.jsx`).
* **Extension**: The browser extension code, including the manifest file and popup scripts.
* **Web Scrapping**: A Python script that scrapes the content of the news articles from the provided URLs (`Web Scrapping/NewsScraping.py`).

## Technologies Used

* **Backend**:
    * Python, Flask, SQLite
    * Node.js, Express, MongoDB
* **Frontend**:
    * HTML, CSS, JavaScript
    * React
* **Machine Learning**:
    * Python
    * Hugging Face Transformers (specifically, the DistilBART model)
* **Web Scraping**:
    * Python
    * BeautifulSoup
    * Requests

## Setup and Installation

### Backend

1.  **Python Backend**:
    * Navigate to the `Backend` directory.
    * Install the required Python packages: `pip install -r requirements.txt` (A `requirements.txt` would need to be created from the imported modules in `all_in_one.py`).
    * Run the Flask server: `python all_in_one.py`

2.  **Node.js Backend**:
    * Navigate to the `Backend/news-auth-backend` directory.
    * Install the dependencies: `npm install`
    * Create a `.env` file with `MONGO_URI` and `JWT_SECRET` variables.
    * Start the server: `node server.js`

### ML Model

* The model is trained using the `ML Model/mini_project.py` script.
* The trained model is saved in the `./summarizer_model` directory and used by the Python backend.

### Browser Extension

1.  Open your browser's extension management page.
2.  Enable "Developer mode".
3.  Click on "Load unpacked" and select the `Extension` directory.

## Usage

1.  Log in or sign up through the extension popup.
2.  Navigate to a news article you want to summarize.
3.  Click on the extension icon.
4.  Adjust the desired summary length using the slider.
5.  Click the "Summarize" button.
6.  The summary will be displayed in the popup. You can then copy, download, or share it.

## Screenshot

![UI Screenshot](bornik03/mini_project/Mini_Project-ca2c29094a52b3d3ee9dd507e19a0f0020f48a31/UI/ui.png)
