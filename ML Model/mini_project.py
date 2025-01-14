from transformers import pipeline

summarizer = pipeline("summarization", model="Falconsai/text_summarization")

ARTICLE = """ 
#Your Text Here
"""
print(summarizer(ARTICLE, max_length=50, min_length=30, do_sample=False))