FROM node:alpine
RUN mkdir /user
ADD ../user ./user/
ADD ../common ./user/
WORKDIR /user
RUN npm install
CMD ["node", "login-registration.js"]