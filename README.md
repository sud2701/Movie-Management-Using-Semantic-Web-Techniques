For Mac/Linux Systems

Use following .env file for docker

DB=mongodb://mongodb:27017/movie_recommender
JWTPRIVATEKEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsInNhbHQiOjEwfQ.eyJfaWQiOiIxMjMiLCJuYW1lIjoic2NoYWRvdHJhIn0.D5nYNrOs4pUaOi2lVjVkw8mAv2KbjaDp4woMnGtS1QA
API_GATEWAY_DOMAIN=localhost
USER_DOMAIN=user
REVIEW_SERVICE_DOMAIN=localhost
MOVIE_RECOMMENDER_DOMAIN=movie
MONGOOSE=mongodb
FUSEKI=fuseki
RABBIT_MQ_URL=rabbitmq
MAILER_QUEUE_NAME=mailer
SERVER_MAIL_ID=ibatj7@gmail.com
SERVER_MAIL_PASSWORD=khyizeqtkqrhwdxn

Paste the above values into each folder of backend into a .env file

Have a docker based system. Run docker compose --env-file backend/common/.env up --build

For accessing the UI go to http://localhost:8002/login

OR

Use following .env file for shell script

DB=mongodb://localhost:27017/movie_recommender
JWTPRIVATEKEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsInNhbHQiOjEwfQ.eyJfaWQiOiIxMjMiLCJuYW1lIjoic2NoYWRvdHJhIn0.D5nYNrOs4pUaOi2lVjVkw8mAv2KbjaDp4woMnGtS1QA
API_GATEWAY_DOMAIN=localhost
USER_DOMAIN=localhost
REVIEW_SERVICE_DOMAIN=localhost
MOVIE_RECOMMENDER_DOMAIN=localhost
MONGOOSE=localhost
FUSEKI=localhost
RABBIT_MQ_URL=localhost
MAILER_QUEUE_NAME=mailer
SERVER_MAIL_ID=ibatj7@gmail.com
SERVER_MAIL_PASSWORD=khyizeqtkqrhwdxn

You can copy the details of docker-compose2.yml into docker-compose.yml file. And just run the runner.sh file. 

For accessing the UI go to http://localhost:4200/login


For Windows System

You need to have mongodb, rabbitmq, nodejs - 18.10.0 version

Copy the files in the backend/common directory in every directory of backend folder


Add .env from common into each directory of backend and only frontend directory with following values

DB=mongodb://localhost:27017/movie_recommender
JWTPRIVATEKEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsInNhbHQiOjEwfQ.eyJfaWQiOiIxMjMiLCJuYW1lIjoic2NoYWRvdHJhIn0.D5nYNrOs4pUaOi2lVjVkw8mAv2KbjaDp4woMnGtS1QA
API_GATEWAY_DOMAIN=localhost
USER_DOMAIN=localhost
REVIEW_SERVICE_DOMAIN=localhost
MOVIE_RECOMMENDER_DOMAIN=localhost
MONGOOSE=localhost
FUSEKI=localhost
RABBIT_MQ_URL=localhost
MAILER_QUEUE_NAME=mailer
SERVER_MAIL_ID=ibatj7@gmail.com
SERVER_MAIL_PASSWORD=khyizeqtkqrhwdxn

Go to backend and all the folders. Run npm start
Go to frontend and run npm start
