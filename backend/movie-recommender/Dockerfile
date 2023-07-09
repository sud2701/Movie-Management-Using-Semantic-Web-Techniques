FROM node:alpine
RUN mkdir /movie-recommender
ADD ../movie-recommender ./movie-recommender/
ADD ../common ./movie-recommender/
WORKDIR /movie-recommender
RUN npm install
CMD ["node", "movie-endpoints.js"]