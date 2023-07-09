FROM python:3.10.6
RUN apt-get update && apt-get -y install cmake protobuf-compiler
RUN apt-get update && apt-get install -y gfortran libfreetype6-dev libhdf5-dev liblapack-dev libopenblas-dev libpng-dev && \
    rm -rf /var/lib/apt/lists/* 
RUN mkdir /ml-model
ADD ../ml-model ./ml-model
WORKDIR /ml-model
RUN pip install -r requirements.txt
RUN python -m nltk.downloader punkt
RUN python -m nltk.downloader stopwords
CMD ["python","ml-script/model.py"]