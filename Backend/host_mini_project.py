from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_name = "./summarizer_model"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

app = Flask(__name__)

@app.route("/summarize", methods=["POST"])
def summarize():
    data = request.get_json()
    if "text" not in data:
        return jsonify({"error": "No text provided for summarization"}), 400
    
    input_text = data["text"]

    inputs = tokenizer(
        input_text,
        max_length=1024,
        truncation=True,
        return_tensors="pt"
    )

    # Generating summary
    summary_ids = model.generate(
        inputs["input_ids"],
        max_length=300,
        min_length=100,
        num_beams=4
    )
    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

    # Returning summary
    return jsonify({"summary": summary})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)