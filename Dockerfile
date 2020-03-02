FROM node:12.13-alpine
ARG NODE_ENV=%env

WORKDIR /app
COPY . .

RUN NODE_ENV=$NODE_ENV npm install
EXPOSE 3000

CMD npm start