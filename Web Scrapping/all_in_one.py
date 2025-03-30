import extraction
import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from werkzeug.security import generate_password_hash, check_password_hash

# Load model and tokenizer
model_name = "./summarizer_model"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

app = Flask(__name__)
CORS(app)

# Keep track of logged in user (user_id)
logged_in_user_id = None

# Initialize database
def init_db():
    conn = sqlite3.connect("news.db")
    cursor = conn.cursor()
    # Users table with password
    cursor.execute('''CREATE TABLE IF NOT EXISTS users
                    (id INTEGER PRIMARY KEY AUTOINCREMENT,
                     username TEXT NOT NULL UNIQUE,
                     password TEXT NOT NULL)''')
    # News table with user_id
    cursor.execute('''CREATE TABLE IF NOT EXISTS news
                    (id INTEGER PRIMARY KEY AUTOINCREMENT,
                     url TEXT NOT NULL,
                     max_words INTEGER NOT NULL,
                     content TEXT,
                     summary TEXT,
                     user_id INTEGER NOT NULL,
                     UNIQUE(url, max_words, user_id),
                     FOREIGN KEY (user_id) REFERENCES users(id))''')
    conn.commit()
    conn.close()

init_db()  # Call once when the server starts

def get_user_id():
    return logged_in_user_id

@app.route("/", methods=["GET"])
def index():
    user_id = get_user_id()
    if user_id:
        conn = sqlite3.connect("news.db")
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM users WHERE id=?", (user_id,))
        user = cursor.fetchone()
        conn.close()
        if user:
            return jsonify({"message": f"Logged in as {user[0]}"})
        else:
            return jsonify({"message": "Logged in (user data not found)"})
    else:
        return jsonify({"message": "Not logged in"})

@app.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json()
        if not data or "username" not in data or "password" not in data:
            return jsonify({"error": "Missing username or password"}), 400
        username = data["username"]
        password = data["password"]

        conn = sqlite3.connect("news.db")
        cursor = conn.cursor()

        # Check if username already exists
        cursor.execute("SELECT id FROM users WHERE username=?", (username,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "Username already exists"}), 409

        hashed_password = generate_password_hash(password)
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_password))
        conn.commit()
        conn.close()
        return jsonify({"message": "User registered successfully"})
    except Exception as e:
        print(f"Signup Error: {e}")
        return jsonify({"error": f"Signup failed: {str(e)}"}), 500

@app.route("/login", methods=["POST"])
def login():
    global logged_in_user_id
    try:
        data = request.get_json()
        if not data or "username" not in data or "password" not in data:
            return jsonify({"error": "Missing username or password"}), 400
        username = data["username"]
        password = data["password"]

        conn = sqlite3.connect("news.db")
        cursor = conn.cursor()
        cursor.execute("SELECT id, password FROM users WHERE username=?", (username,))
        user = cursor.fetchone()
        conn.close()

        if user and check_password_hash(user[1], password):
            logged_in_user_id = user[0]
            return jsonify({"message": f"Logged in successfully as {username}", "user_id": logged_in_user_id})
        else:
            return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        print(f"Login Error: {e}")
        return jsonify({"error": f"Login failed: {str(e)}"}), 500

@app.route("/logout", methods=["POST"])
def logout():
    global logged_in_user_id
    logged_in_user_id = None
    return jsonify({"message": "Logged out successfully"})

@app.route("/summarize", methods=["POST"])
def summarize():
    user_id = get_user_id()
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401
    try:
        input_data = request.get_json()
        if not input_data or "url" not in input_data:
            return jsonify({"error": "Missing 'url' in request body"}), 400

        site_url = input_data["url"]
        max_words = int(input_data.get("max_words", 100))  # Default 100 words

        # Check if already summarized for this user with the same max_words
        conn = sqlite3.connect("news.db")
        cursor = conn.cursor()
        cursor.execute("SELECT summary FROM news WHERE url=? AND max_words=? AND user_id=?", (site_url, max_words, user_id))
        existing_summary = cursor.fetchone()
        if existing_summary:
            conn.close()
            return jsonify({"summary": existing_summary[0]})

        # Scrape the news
        extraction.set_url(site_url)
        data = extraction.news_scrape()

        if not data:
            return jsonify({"error": "Failed to scrape content"}), 500

        inputs = tokenizer(
            data, max_length=1024, truncation=True,
            padding="longest", return_tensors="pt"
        )

        def clean_summary(summary, target_length):
            sentences = summary.split(". ")
            final_summary = ""
            for sentence in sentences:
                if len(final_summary.split()) + len(sentence.split()) <= target_length:
                    final_summary += sentence + ". "
                else:
                    break
            return final_summary.strip()

        summary_ids = model.generate(
            inputs["input_ids"],
            max_length=max_words+20, min_length=max_words-5,
            num_beams=5, early_stopping=True, no_repeat_ngram_size=3,
            length_penalty=1.0, eos_token_id=tokenizer.eos_token_id
        )
        raw_summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        final_summary = clean_summary(raw_summary, max_words)

        # Store in database with user_id
        cursor.execute("INSERT INTO news (url, max_words, content, summary, user_id) VALUES (?, ?, ?, ?, ?)",
                       (site_url, max_words, data, final_summary, user_id))
        conn.commit()
        conn.close()

        return jsonify({"summary": final_summary})

    except Exception as e:
        print(f"Server Error: {e}")
        return jsonify({"error": f"An internal error occurred: {str(e)}"}), 500

@app.route("/summarize/history", methods=["GET"])
def get_history():
    user_id = get_user_id()
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401
    """Retrieve stored summaries for the logged-in user."""
    conn = sqlite3.connect("news.db")
    cursor = conn.cursor()
    cursor.execute("SELECT url, max_words, summary FROM news WHERE user_id=? ORDER BY id DESC", (user_id,))
    history = [{"url": row[0], "max_words": row[1], "summary": row[2]} for row in cursor.fetchall()]
    conn.close()
    return jsonify({"history": history})

@app.route("/clear", methods=["DELETE"])
def clear_history():
    user_id = get_user_id()
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401
    """Clear all stored summaries for the logged-in user."""
    conn = sqlite3.connect("news.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM news WHERE user_id=?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "History cleared successfully"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)