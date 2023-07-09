FROM node:alpine
RUN mkdir /mailer-service
ADD ../mailer-service ./mailer-service/
ADD ../common ./mailer-service/
WORKDIR /mailer-service
RUN npm install
CMD ["node", "mailer.js"]