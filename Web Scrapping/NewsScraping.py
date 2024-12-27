import json
from bs4 import BeautifulSoup
import requests


site_URL = ''

def news_scrape():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    }
    html_text = requests.get(site_URL, headers = headers).text
    soup = BeautifulSoup(html_text, 'lxml')

    news_heading = ''
    news_body = ''

    news_heading = soup.head.title.text
    news_body_list = soup.body.find_all('p')

    for news_line in news_body_list:
        news_body += news_line.text + ' '

    news = {
        'news_heading': news_heading,
        'news_body': news_body
    }

    news_json = json.dumps(news, indent = 4)

    return news_json

def set_url(api_URL):
    global site_URL
    site_URL = api_URL


if __name__ == '__main__':
    set_url()
    print(news_scrape())