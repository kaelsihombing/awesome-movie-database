# Awesome Movie Database

Awesome Movie Database is a movie database where everyone can create a review for his/her favorite movie.
All reviews are viewable by everyone. Make your review counts!

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites
There are quite a few dependencies to be installed before we can start using this application, some of them are:
- express
- mongoose
- bcryptjs
- jsonwebtoken
- axios
- etc.

### Installing
All of package.json dependencies can be installed by typing in command below:
```
npm install
```
After installation is finished, start configuring the environment variable.
In this application, environment variable is saved to .env file. An example of .env file can be found on .env.example file.

## Running The Tests

To trigger unit testing code, simply type in command below:
```
npm test
```

For detailed script of test, see package.json scripts

## Running The Application on Local Machine

To fire up the server in local machine, simply type in one of two commands below:
```
npm start
```
or
```
npm run dev
```
npm start will fire up the server, but won't restart if there's any changes in code.
npm run dev uses nodemon, so it will monitor changes in code and attempt to restart the server.

For detailed script of dev, see package.json scripts

## Documentation

Documentation of how to use this application was done using swagger.
Documentation URL: [Documentation](https://awesome-movie-data.herokuapp.com/documentation/)

## Deployment

Deployment was done in two ways:
1. Development
    - Deployment for development environment is done to heroku through gitlab-ci script

2. Production
    - Deployment for production environment is done to digitalocean vps droplet through gitlab-ci script

For detailed deployment script, see gitlag-ci.yml file

## Built With

* [Express](https://expressjs.com/) - Framework
* [MongoDB](https://www.mongodb.com/) - Database

## Authors

* **Kevin Andrio** - *Initial work* - [Ellvisca](https://gitlab.com/ellvisca)
* **Santo Michael Sihombing** - *Initial work* - [KaelSihombing](https://gitlab.com/kaelsihombing)

## Acknowledgements

* Special thanks to Fikri Rahmat Nurhidayat as authors' mentor - [FikriRNurhidayat](https://gitlab.com/FikriRNurhidayat)
* Hat tip to GA Batch#5 batchmates