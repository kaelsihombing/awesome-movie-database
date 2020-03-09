const mongoose = require('mongoose');
const Double = require('@mongoosejs/double')
const mongooseFindAndFilter = require('mongoose-find-and-filter');
const Schema = mongoose.Schema;
const axios = require('axios');
const mongoosePaginate = require('mongoose-paginate-v2');

const Incumbent = require('./incumbent.js')
const Genre = require('./genre')

const movieSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    year: {
        type: Number
    },
    duration: {
        type: String
    },
    genres: [{
        id: String,
        genre: String
    }],
    directors: [{
        type: Object
    }],
    writers: [{
        id: String,
        name: String
    }],
    casts: [{
        id: String,
        name: String
    }],
    synopsis: {
        type: String,
        default: '-'
    },
    poster: {
        type: String,
        default: '-'
    },
    trailer: {
        type: String,
        default: '-'
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review',
    }],
    rating: {
        type: Double,
        default: 0,
    },

    addedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    lastUpdatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
},
    {
        versionKey: false,
        timestamps: true,
    }
)
movieSchema.plugin(mongooseFindAndFilter);
movieSchema.plugin(mongoosePaginate)

class Movie extends mongoose.model('Movie', movieSchema) {

    static findGenre(genre, movie) {
        return new Promise((resolve, reject) => {
            Genre.findOne({ genre: genre })
                .then(async dataGenre => {
                    if (!dataGenre) {
                        let newGenre = {
                            genre: genre
                        }
                        let result = await Genre.create(newGenre)
                        resolve(result)
                    } else {
                        if (!dataGenre.movie.includes(movie)) {
                            resolve(dataGenre)
                        }
                    }
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    static findIncumbent(incumbent, title) {
        return new Promise((resolve, reject) => {
            Incumbent.findOne({ name: incumbent })
                .then(async dataIncumbent => {
                    if (!dataIncumbent) {
                        let newIncumbent = {
                            name: incumbent
                        }
                        if (incumbent !== 'N/A') {
                            let result = await Incumbent.create(newIncumbent)
                            resolve(result)
                        }
                    } else {
                        if (!dataIncumbent.movie.includes(title)) {
                            // dataIncumbent.movie.push(title)
                            // dataIncumbent.save()
                            resolve(dataIncumbent)
                        } else {
                            resolve(dataIncumbent)
                        }

                    }
                }).catch(err =>
                    reject(err)
                )
        })
    }

    static async register(creator, role, bodyParams) {

        //==============DIRECTOR==================
        let promiseDirectors = [];
        if (bodyParams.directors) {
            var directorsSplit = bodyParams.directors.split(',')
            let fixDirectors = [];

            for (let i = 0; i <= directorsSplit.length - 1; i++) {

                let newDirectors = directorsSplit[i].split(' (')

                newDirectors = newDirectors[0]

                if (newDirectors[0] === ' ') {
                    newDirectors = newDirectors.substring(1)
                }

                fixDirectors.push(newDirectors)
            }
            let noDuplicateDirectors = [...new Set(fixDirectors)]
            noDuplicateDirectors.map(item => {
                promiseDirectors.push(Movie.findIncumbent(item, bodyParams.title))
            })
        }

        //================WRITER==================
        let promiseWriters = [];
        if (bodyParams.writers) {
            let writerSplit = bodyParams.writers.split(',');
            let fixWriter = [];

            for (let i = 0; i <= writerSplit.length - 1; i++) {

                let newWriter = writerSplit[i].split(' (')

                newWriter = newWriter[0]

                if (newWriter[0] === ' ') {
                    newWriter = newWriter.substring(1)
                }

                fixWriter.push(newWriter)
            }

            let noDuplicateWriter = [...new Set(fixWriter)]
            noDuplicateWriter.map(item => {
                promiseWriters.push(Movie.findIncumbent(item, bodyParams.title))
            })
        }

        //================CAST/ACTOR==================
        let promiseCasts = []
        if (bodyParams.casts) {
            let castSplit = bodyParams.casts.split(',');
            let fixCast = [];
            for (let i = 0; i <= castSplit.length - 1; i++) {
                let newCast = castSplit[i].split(' (')
                newCast = newCast[0]

                if (newCast[0] === ' ') {
                    newCast = newCast.substring(1)
                }
                fixCast.push(newCast)
            }
            let noDuplicateCast = [...new Set(fixCast)]
            noDuplicateCast.map(item => {
                promiseCasts.push(Movie.findIncumbent(item, bodyParams.title))
            })
        }
        //==============GENRE====================
        let promiseGenres = [];
        if (bodyParams.genres) {
            let genreSplit = bodyParams.genres.split(',');
            let fixGenre = [];
            for (let i = 0; i <= genreSplit.length - 1; i++) {
                let newGenre = genreSplit[i].split(' (')
                newGenre = newGenre[0]

                if (newGenre[0] === ' ') {
                    newGenre = newGenre.substring(1);
                }
                fixGenre.push(newGenre)
            }
            let noDuplicateGenre = [...new Set(fixGenre)]
            noDuplicateGenre.map(item => {
                promiseGenres.push(Movie.findGenre(item, bodyParams.title))
            })
        }


        //===================================================================================
        let directorList = await Promise.all(promiseDirectors);
        let writerList = await Promise.all(promiseWriters);
        let castList = await Promise.all(promiseCasts);
        let genreList = await Promise.all(promiseGenres)
        //===================================================================================

        return new Promise((resolve, reject) => {
            if (role != 'ADMIN') return reject("You're not Authorized!")

            let params = {
                title: bodyParams.title,
                year: bodyParams.year,
                synopsis: bodyParams.synopsis,
                genres: [],
                casts: [],
                directors: [],
                writers: [],
                poster: bodyParams.poster,
                trailer: bodyParams.trailer,
                addedBy: creator,
                lastUpdatedBy: creator,
            }

            directorList.map(item => {
                params.directors.push({ id: item._id, name: item.name })
            })


            writerList.map(item => {
                params.writers.push({ id: item._id, name: item.name })
            })


            castList.map(item => {
                params.casts.push({ id: item._id, name: item.name })
            })


            genreList.map(item => {
                params.genres.push({ id: item._id, genre: item.genre })
            })

            for (let prop in params) {
                if (!params[prop] || params[prop].length === 0) delete params[prop]
            }

            //================================================================
            this.create(params)
                .then(data => {
                    if (data.casts) {
                        data.casts.map(async item => {
                            await Incumbent.findByIdAndUpdate(item.id, { $push: { movie: { id: data._id, movie: data.title } } })
                        })
                    }

                    if (data.directors) {
                        data.directors.map(async item => {
                            await Incumbent.findByIdAndUpdate(item.id, { $push: { movie: { id: data._id, movie: data.title } } })
                        })
                    }

                    if (data.writers) {
                        data.writers.map(async item => {
                            await Incumbent.findByIdAndUpdate(item.id, { $push: { movie: { id: data._id, movie: data.title } } })
                        })
                    }

                    if (data.genres) {
                        data.genres.map(async item => {
                            await Genre.findByIdAndUpdate(item.id, { $push: { movie: { id: data._id, title: data.title, poster: data.poster } } })
                        })
                    }

                    resolve(data)
                })
                .catch(err => {
                    reject(err)
                })
        })
    }


    static show(pagination, page, movieId) {
        return new Promise((resolve, reject) => {
            let options = {
                page: page,
                limit: 10,
                pagination: JSON.parse(pagination),
                populate: [{
                    path: 'addedBy',
                    select: ['fullname', 'role']
                },
                {
                    path: 'lastUpdatedBy',
                    select: ['fullname', 'role']
                }],
                sort: '-updatedAt',
                collation: { locale: 'en' }
            }

            if (movieId) {
                this.findById(movieId)
                    .populate({
                        path: 'reviews',
                    })
                    .then(data => {
                        resolve(data)
                    })
                    .catch(err => {
                        reject(err)
                    })
            }

            else if (!movieId) {
                this.find({})
                    .then(data => {
                        let lastPage = Math.floor(data.length / 10) + 1
                        if (options.page > lastPage || options.page < 0) options.page = 1

                        this.paginate({}, options)
                            .then(data => {
                                resolve(data)
                            })
                    })
            }
        })
    }

    static update(movieId, editor, role, bodyParams) {
        return new Promise((resolve, reject) => {
            if (role != 'ADMIN') return reject("You're not allowed to edit movie information")
            // this.findById(movieId)
            //     .then(data => {
            //         data.directors.map(item => {
            //             console.log(item)
            //         })
            //     })
            // if (bodyParams.directors) {
            //     bodyParams.directors.map(item => {
            //         console.log(item);
            //         Incumbent.findByIdAndUpdate({id: item.id}, {name:item})       
            //     })
            // }
            let params = {
                title: bodyParams.title,
                year: bodyParams.year,
                duration: bodyParams.duration,
                // directors: bodyParams.directors,
                // writers: bodyParams.writers,
                // casts: bodyParams.casts,
                synopsis: bodyParams.synopsis,
                poster: bodyParams.poster,
                trailer: bodyParams.trailer,
                lastUpdatedBy: editor,
            }

            for (let prop in params) if (!params[prop]) delete params[prop]

            this.findByIdAndUpdate(movieId, params, { new: true })
                .then(data => {
                    resolve(data)
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    static deleteMovie(role, movieId) {
        return new Promise((resolve, reject) => {
            if (role !== 'ADMIN') return reject('Sorry you\'re not authorized to do this');


            this.findByIdAndDelete(movieId)
                .then(movie => {
                    if (movie.directors) {
                        movie.directors.map(item => {
                            Incumbent.findById(item.id)
                                .then(async incumbent => {
                                    let index = incumbent.movie.findIndex(found => found.movie === movie.title);
                                    await incumbent.movie.splice(index, 1)
                                    incumbent.save()
                                })
                        })
                    }
                    resolve({ id: movie._id, message: `Movie '${movie.title}' successfuly deleted` })
                })
                .catch(err => {
                    reject({ message: 'this movie does not exist in our database, please input a valid movie id', err: err })
                })
        })
    }

    static copyMovie(movieId, creator, role) {
        return new Promise((resolve, reject) => {
            if (role !== 'ADMIN') return ('You are not Authorized')

            axios.get(`http://www.omdbapi.com/?apikey=4a5e611c&i=${movieId}`)
                .then(data => {

                    let movieData = data.data;

                    Movie.findOne({ title: movieData.Title })
                        .then(async foundData => {

                            if (foundData) return reject('Movie already exist in the database!')
                            //==============DIRECTOR==================
                            let promiseDirectors = [];
                            if (movieData.Director && movieData.Director !== 'N/A') {
                                var directorsSplit = movieData.Director.split(',')
                                let fixDirectors = [];

                                for (let i = 0; i <= directorsSplit.length - 1; i++) {

                                    let newDirectors = directorsSplit[i].split(' (')

                                    newDirectors = newDirectors[0]

                                    if (newDirectors[0] === ' ') {
                                        newDirectors = newDirectors.substring(1)
                                    }

                                    fixDirectors.push(newDirectors)
                                }
                                let noDuplicateDirectors = [...new Set(fixDirectors)]
                                noDuplicateDirectors.map(item => {
                                    promiseDirectors.push(Movie.findIncumbent(item, movieData.title))
                                })
                            }

                            //================WRITER==================
                            let promiseWriters = [];
                            if (movieData.Writer) {
                                let writerSplit = movieData.Writer.split(',');
                                let fixWriter = [];

                                for (let i = 0; i <= writerSplit.length - 1; i++) {

                                    let newWriter = writerSplit[i].split(' (')

                                    newWriter = newWriter[0]

                                    if (newWriter[0] === ' ') {
                                        newWriter = newWriter.substring(1)
                                    }

                                    fixWriter.push(newWriter)
                                }

                                let noDuplicateWriter = [...new Set(fixWriter)]
                                noDuplicateWriter.map(item => {
                                    promiseWriters.push(Movie.findIncumbent(item, movieData.title))
                                })
                            }

                            //================CAST/ACTOR==================
                            let promiseCasts = []
                            if (movieData.Actors) {
                                let castSplit = movieData.Actors.split(',');
                                let fixCast = [];
                                for (let i = 0; i <= castSplit.length - 1; i++) {
                                    let newCast = castSplit[i].split(' (')
                                    newCast = newCast[0]

                                    if (newCast[0] === ' ') {
                                        newCast = newCast.substring(1)
                                    }
                                    fixCast.push(newCast)
                                }
                                let noDuplicateCast = [...new Set(fixCast)]
                                noDuplicateCast.map(item => {
                                    promiseCasts.push(Movie.findIncumbent(item, movieData.title))
                                })
                            }

                            //==============GENRE====================
                            let promiseGenres = [];
                            if (movieData.Genre) {
                                let genreSplit = movieData.Genre.split(',');
                                let fixGenre = [];
                                for (let i = 0; i <= genreSplit.length - 1; i++) {
                                    let newGenre = genreSplit[i].split(' (')
                                    newGenre = newGenre[0]

                                    if (newGenre[0] === ' ') {
                                        newGenre = newGenre.substring(1)
                                    }
                                    fixGenre.push(newGenre)
                                }
                                let noDuplicateGenre = [...new Set(fixGenre)]
                                noDuplicateGenre.map(item => {
                                    item = item.toLowerCase()
                                    promiseGenres.push(Movie.findGenre(item, movieData.title))
                                })
                            }

                            //===================================================================================
                            let directorList = await Promise.all(promiseDirectors);
                            let writerList = await Promise.all(promiseWriters);
                            let castList = await Promise.all(promiseCasts);
                            let genreList = await Promise.all(promiseGenres)

                            //===================================================================================



                            if (role != 'ADMIN') return reject("You're not Authorized!")

                            let params = {
                                title: movieData.Title,
                                synopsis: movieData.Plot,
                                genres: [],
                                casts: [],
                                directors: [],
                                writers: [],
                                poster: movieData.Poster,
                                addedBy: creator,
                                lastUpdatedBy: creator,
                            }

                            if (movieData.Director === 'N/A') {
                                params.directors.push(movieData.Director)
                            }
                            //==============YEAR==================
                            var minIndex = movieData.Year.indexOf("–")
                            if (minIndex > -1) {
                                var yearSplit = movieData.Year.split(',')
                                for (let i = 0; i <= yearSplit.length - 1; i++) {
                                    let newYear = yearSplit[i].split('-')
                                    newYear = parseInt(newYear[0])
                                    params.year = newYear
                                }
                            } else {
                                params.year = movieData.Year
                            }

                            directorList.map(item => {
                                params.directors.push({ id: item._id, name: item.name })
                            })

                            writerList.map(item => {
                                params.writers.push({ id: item._id, name: item.name })
                            })

                            castList.map(item => {
                                params.casts.push({ id: item._id, name: item.name })
                            })

                            genreList.map(item => {
                                params.genres.push({ id: item._id, genre: item.genre })
                            })

                            Movie.create(params)
                                .then(data => {

                                    if (data.casts) {
                                        data.casts.map(async item => {
                                            await Incumbent.findByIdAndUpdate(item.id, { $push: { movie: { id: data._id, movie: data.title } } })
                                        })
                                    }

                                    if (data.directors == data.directors !== 'N/A') {
                                        data.directors.map(async item => {
                                            await Incumbent.findByIdAndUpdate(item.id, { $push: { movie: { id: data._id, movie: data.title } } })
                                        })
                                    }

                                    if (data.writers) {
                                        data.writers.map(async item => {
                                            await Incumbent.findByIdAndUpdate(item.id, { $push: { movie: { id: data._id, movie: data.title } } })
                                        })
                                    }

                                    if (data.genres) {
                                        data.genres.map(async item => {
                                            await Genre.findByIdAndUpdate(item.id, { $push: { movie: { id: data._id, title: data.title, poster: data.poster } } })
                                        })
                                    }
                                    resolve(data)
                                })
                                .catch(err => {
                                    reject(err)
                                })
                        })
                })
                .catch(err => {
                    return (err)
                })
        })
            .catch(err => {
                return (err)
            })
    }

    static findByTitle(title) {
        return new Promise((resolve, reject) => {
            this.findOne({ title: title })
                .then(data => {
                    if (!data) reject("There is no movie with that title")
                    else {
                        resolve(data)
                    }
                })
        })
    }

    static filterAndSorting(pagination, page, sortingBy) {
        return new Promise((resolve, reject) => {
            let options = {
                page: page,
                limit: 10,
                pagination: JSON.parse(pagination),
                select: ['rating', 'title', 'year', 'poster'],
                sort: sortingBy,
                collation: { locale: 'en' }
            }

            this.find({})
                .then(data => {
                    let lastPage = Math.floor(data.length / 10) + 1
                    if (options.page > lastPage || options.page < 0) options.page = 1

                    this.paginate({}, options)
                        .then(data => {
                            resolve(data)
                        })
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    static search(query, page) {
        return new Promise((resolve, reject) => {

            // util function to convert the input to string type
            function myCamelFunction(value) {
                function convertToString(input) {

                    if (input) {

                        if (typeof input === "string") {

                            return input;
                        }

                        return String(input);
                    }
                    return '';
                }

                // convert string to words
                function toWords(input) {

                    input = convertToString(input);

                    var regex = /[A-Z\xC0-\xD6\xD8-\xDE]?[a-z\xDF-\xF6\xF8-\xFF]+|[A-Z\xC0-\xD6\xD8-\xDE]+(?![a-z\xDF-\xF6\xF8-\xFF])|\d+/g;

                    return input.match(regex);

                }

                // convert the input array to camel case
                function toCamelCase(inputArray) {

                    // let result = "";
                    var newResult = []


                    for (let i = 0, len = inputArray.length; i < len; i++) {

                        let currentStr = inputArray[i];

                        let tempStr = currentStr.toLowerCase();

                        // if(i != 0) {
                        // convert first letter to upper case (the word is in lowercase) 
                        tempStr = tempStr.substr(0, 1).toUpperCase() + tempStr.substr(1);
                        //  }

                        // result += tempStr;
                        newResult.push(tempStr)

                    }
                    var fix = newResult.join(' ')
                    return fix;
                }


                // this function call all other functions

                function toCamelCaseString(value) {

                    let words = toWords(value);

                    return toCamelCase(words);

                }

                return toCamelCaseString(value)
            }
            let last = myCamelFunction(query)
            let option = {
                limit: 10,
                page: page,
                select: ['_id', 'title', 'rating', 'poster', 'genre', 'year']
            }

            this.find({ title: { $regex: last, $options: 'i' } })
                .then(data => {
                    let lastPage = Math.floor(data.length / 10) + 1
                    if (option.page > lastPage || option.page < 0) option.page = 1
                    this.paginate({ title: { $regex: last, $options: 'i' } }, option)
                        .then(data => {
                            if (data.docs === 0) return reject({ message: `${query} not found` })
                            resolve(data)
                        })
                        .catch(err => {
                            reject({ err, message: `${query} not found` })
                        })

                })
        })
    }

    static genre(genre, page) {
        return new Promise((resolve, reject) => {
            let options = {
                page: page,
                limit: 10,
                pagination: true,
                select: ['rating', 'title', 'year', 'poster'],
                sort: 'updatedAt',
                collation: { locale: 'en' }
            }

            this.find({ genres: { $elemMatch: { genre: genre } } })
                .then(data => {
                    if (data.length == 0) reject(`There is no movie with genre: ${genre}`)
                    let lastPage = Math.floor(data.length / 10) + 1
                    if (options.page > lastPage || options.page < 0) options.page = 1

                    this.paginate({ genres: { $elemMatch: { genre: genre } } }, options)
                        .then(data => {
                            resolve(data)
                        })
                })
                .catch(err => {
                    reject(err)
                })
        })
    }
}

module.exports = Movie