from bs4 import BeautifulSoup
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_name = "./summarizer_model"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

def news_scrape(site_URL):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"

    }
    try:
        response = requests.get(site_URL, headers=headers)
        response.raise_for_status()
        html_text = response.text
        soup = BeautifulSoup(html_text, 'lxml')
        news_body_list = soup.body.find_all('p') if soup.body else []
        news_body = " ".join([p.text.strip() for p in news_body_list])
        return news_body.strip()
    except Exception as e:
        return None

app = Flask(__name__)
CORS(app)
@app.route("/summarize", methods=["POST"])
def summarize():
    try:
        input_data = request.get_json()
        if not input_data or "url" not in input_data:
            return jsonify({"error": "Missing 'url' in request body"}), 400
        site_url = input_data["url"]
        data = news_scrape(site_url)
        if not data:
            return jsonify({"error": "Failed to scrape content from the provided URL"}), 500

        inputs = tokenizer(
            data,
            max_length=1024,
            truncation=True,
            return_tensors="pt"
        )
        summary_ids = model.generate(
            inputs["input_ids"],
            max_length=200,
            min_length=100,
            num_beams=3
        )
        summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        return jsonify({"summary": summary})
    except Exception as e:
        return jsonify({"error": f"An internal error occurred: {str(e)}"}), 500
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)