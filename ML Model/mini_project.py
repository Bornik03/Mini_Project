from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_name = "sshleifer/distilbart-cnn-12-6"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

def load_data_from_file(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()

    # Split news and summaries
    news = [section.strip() for section in content.split("<news>")[1:]]
    summaries = [section.split("</summary>")[0].strip() for section in content.split("<summary>")[1:]]

    news = [item.split("</news>")[0].strip() for item in news]
    return news, summaries

# Loading data from file
file_path = "samplenews.txt"
news_list, summaries_list = load_data_from_file(file_path)
from datasets import Dataset

# Creating dataset dictionary
data = {"input_text": news_list, "target_text": summaries_list}

# Converting to HuggingFace Dataset
dataset = Dataset.from_dict(data)
def preprocess_function(batch):
    inputs = tokenizer(batch["input_text"], max_length=1024, truncation=True, padding="max_length")
    targets = tokenizer(batch["target_text"], max_length=300, truncation=True, padding="max_length")
    inputs["labels"] = targets["input_ids"]
    return inputs

tokenized_dataset = dataset.map(preprocess_function, batched=True)
from transformers import Seq2SeqTrainingArguments, Seq2SeqTrainer

training_args = Seq2SeqTrainingArguments(
    output_dir="./my_model",
    num_train_epochs=5,
    per_device_train_batch_size=1,
    save_steps=10,
    save_total_limit=1,
    evaluation_strategy="no",
    logging_dir="./logs",
    predict_with_generate=True,
    learning_rate=5e-5
)

trainer = Seq2SeqTrainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
    tokenizer=tokenizer
)

trainer.train()

model.save_pretrained("./summarizer_model")
tokenizer.save_pretrained("./summarizer_model")