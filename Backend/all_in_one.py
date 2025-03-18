import extraction
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_name = "./summarizer_model"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

app = Flask(__name__)
CORS(app)

@app.route("/summarize", methods=["POST"])
def summarize():
    try:
        input_data = request.get_json()
        if not input_data or "url" not in input_data:
            return jsonify({"error": "Missing 'url' in request body"}), 400
        
        site_url = input_data["url"]
        max_words = int(input_data.get("max_words", 100))

        extraction.set_url(site_url)
        data = extraction.news_scrape()

        if not data:
            return jsonify({"error": "Failed to scrape content from the provided URL"}), 500

        inputs = tokenizer(
            data,
            max_length=1024,
            truncation=True,
            padding="longest",
            return_tensors="pt"
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
            max_length=max_words+20,
            min_length=max_words-5,
            num_beams=5, 
            early_stopping=True, 
            no_repeat_ngram_size=3,
            length_penalty=1.0, 
            eos_token_id=tokenizer.eos_token_id
        )
        raw_summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

        final_summary = clean_summary(raw_summary, max_words)

        return jsonify({"summary": final_summary})
    
    except Exception as e:
        print(f"Server Error: {e}")
        return jsonify({"error": f"An internal error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)