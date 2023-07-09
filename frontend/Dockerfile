FROM node:18.10-alpine
RUN mkdir /frontend
ADD ../frontend ./frontend/
WORKDIR /frontend

RUN npm install
EXPOSE 8002
CMD ["npm", "start"]