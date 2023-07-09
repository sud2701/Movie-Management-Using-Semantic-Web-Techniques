FROM node:alpine
RUN mkdir /api-gateway
ADD ../api-gateway ./api-gateway/
ADD ../common ./api-gateway/
WORKDIR /api-gateway
RUN npm install
CMD ["node", "gateway.js"]