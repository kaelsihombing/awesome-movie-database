FROM node:12.13-alpine

ARG env

WORKDIR /app
COPY . . 
RUN NODE_ENV=$env npm install

CMD npm start