import pandas as pd
import nltk
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelBinarizer
from nltk.corpus import stopwords
from bs4 import BeautifulSoup
import re
from nltk.tokenize.toktok import ToktokTokenizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import os
import warnings
import json
import sys
import pika
import random

warnings.filterwarnings("ignore")
from sklearn.utils import shuffle

model_filename = "mn_model.sav"
mnb = MultinomialNB()

def run_model():
    imdb_data = pd.read_csv(os.path.join(os.path.dirname(__file__), "IMDB_Dataset.csv"))
    imdb_data = shuffle(imdb_data)
    train_sentiments = imdb_data.sentiment[:40000]

    test_sentiments = imdb_data.sentiment[40000:]
    imdb_data["review"] = imdb_data["review"].apply(denoise_text)
    imdb_data["review"] = imdb_data["review"].apply(remove_special_characters)
    imdb_data["review"] = imdb_data["review"].apply(simple_stemmer)

    imdb_data["review"] = imdb_data["review"].apply(remove_stopwords)
    norm_train_reviews = imdb_data.review[:40000]
    norm_test_reviews = imdb_data.review[40000:]
    cv = CountVectorizer(min_df=0, max_df=1, binary=False, ngram_range=(1, 3))
    cv_train_reviews = cv.fit_transform(norm_train_reviews)
    cv_test_reviews = cv.transform(norm_test_reviews)
    tv = TfidfVectorizer(min_df=0, max_df=1, use_idf=True, ngram_range=(1, 3))
    tv_train_reviews = tv.fit_transform(norm_train_reviews)
    tv_test_reviews = tv.transform(norm_test_reviews)

    lb = LabelBinarizer()
    sentiment_data = lb.fit_transform(imdb_data["sentiment"])
    train_sentiments = sentiment_data[:40000]
    test_sentiments = sentiment_data[40000:]

    mnb = MultinomialNB()
    mnb_bow = mnb.fit(cv_train_reviews, train_sentiments)
    mnb_tfidf = mnb.fit(tv_train_reviews, train_sentiments)

    mnb_bow_predict = mnb.predict(cv_test_reviews)
    mnb_tfidf_predict = mnb.predict(tv_test_reviews)

    mnb_bow_score = accuracy_score(test_sentiments, mnb_bow_predict)
    mnb_tfidf_score = accuracy_score(test_sentiments, mnb_tfidf_predict)

    mnb_bow_report = classification_report(
        test_sentiments, mnb_bow_predict, target_names=["Positive", "Negative"]
    )
    mnb_tfidf_report = classification_report(
        test_sentiments, mnb_tfidf_predict, target_names=["Positive", "Negative"]
    )

    cm_bow = confusion_matrix(test_sentiments, mnb_bow_predict, labels=[1, 0])
    cm_tfidf = confusion_matrix(test_sentiments, mnb_tfidf_predict, labels=[1, 0])


def strip_html(text):
    soup = BeautifulSoup(text, "html.parser")
    return soup.get_text()


# Removing the square brackets
def remove_between_square_brackets(text):
    return re.sub("\[[^]]*\]", "", text)


# Removing the noisy text
def denoise_text(text):
    text = strip_html(text)
    text = remove_between_square_brackets(text)
    return text


def remove_special_characters(text, remove_digits=True):
    pattern = r"[^a-zA-z0-9\s]"
    text = re.sub(pattern, "", text)
    return text


def simple_stemmer(text):
    ps = nltk.porter.PorterStemmer()
    text = " ".join([ps.stem(word) for word in text.split()])
    return text


def remove_stopwords(text, is_lower_case=False):
    tokenizer = ToktokTokenizer()
    stopword_list = nltk.corpus.stopwords.words("english")
    tokens = tokenizer.tokenize(text)
    tokens = [token.strip() for token in tokens]
    if is_lower_case:
        filtered_tokens = [token for token in tokens if token not in stopword_list]
    else:
        filtered_tokens = [
            token for token in tokens if token.lower() not in stopword_list
        ]
    filtered_text = " ".join(filtered_tokens)
    return filtered_text



def main():
    # run_model()
    connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
    channel = connection.channel()
    channel.queue_declare(queue='review')
    def callback(ch, method, properties, body):
        my_json = body.decode('utf8').replace("'", '"')
        data = json.loads(my_json)
        predict = random.uniform(0, 1)
        run_model()
        
    channel.basic_consume(queue='review', on_message_callback=callback, auto_ack=True)
    channel.start_consuming()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Interrupted')
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)
