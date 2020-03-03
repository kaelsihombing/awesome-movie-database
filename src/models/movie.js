const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const axios = require('axios');
const mongoosePaginate = require('mongoose-paginate-v2');

const Incumbent = require('./incumbent.js')

const movieSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    duration: {
        type: String
    },
    genres: [{
        type: String
    }],
    directors: [{
        type: String
    }],
    writers: [{
        type: String
    }],
    casts: [{
        type: String
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

movieSchema.plugin(mongoosePaginate)

class Movie extends mongoose.model('Movie', movieSchema) {

    static register(creator, role, bodyParams) {
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

            //==============DIRECTOR==================
            if (bodyParams.directors) {
                var directorsSplit = bodyParams.directors.split(',')
                let fixDirectors = [];

                for (let i = 0; i <= directorsSplit.length - 1; i++) {

                    let newDirectors = directorsSplit[i].split(' (')

                    newDirectors = newDirectors[0]

                    if (newDirectors[0] === ' ') {
                        newDirectors = newDirectors.substring(1)
                    }
                    let noDuplicateDirectors = [...new Set(fixDirectors)]
                    noDuplicateDirectors.map(item => params.directors.push(item))
                }

                let noDuplicateDirectors = [...new Set(fixDirectors)]
                noDuplicateDirectors.map(item => params.directors.push(item))
            }

            if (!bodyParams.directors) {
                delete params.directors
            }
            //==============GENRE====================
            if (bodyParams.genres) {
                let genreSplit = bodyParams.genres.split(',');
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
                noDuplicateGenre.map(item => params.genres.push(item))
            }

            if (!bodyParams.genres) {
                delete params.genres
            }

            //================WRITER==================
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
                noDuplicateWriter.map(item => params.writers.push(item))
            }

            if (!bodyParams.writers) {
                delete params.writers
            }
            //================CAST/ACTOR==================
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
                noDuplicateCast.map(item => params.casts.push(item))
            }

            if (!bodyParams.casts) {
                delete params.casts
            }

            for (let prop in params) {
                if (!params[prop] || params[prop].length === 0) delete params[prop]
            }

            //================================================================
            this.create(params)
                .then(async data => {

                    for (let i = 0; i <= data.directors.length - 1; i++) {
                        await Incumbent.findOne({ name: data.directors[i] })
                            .then(async dataIncumbent => {
                                if (!dataIncumbent) {
                                    let newIncumbent = {
                                        name: data.directors[i],
                                        movie: data.title
                                    }
                                    await Incumbent.create(newIncumbent)
                                } else {
                                    await Incumbent.findOneAndUpdate({ name: data.directors[i] }, { $push: { movie: data.title } })
                                }
                            })
                    }
                    for (let i = 0; i <= data.writers.length - 1; i++) {
                        await Incumbent.findOne({ name: data.writers[i] })
                            .then(async dataIncumbent => {
                                if (!dataIncumbent) {
                                    let newIncumbent = {
                                        name: data.writers[i],
                                        movie: data.title
                                    }
                                    await Incumbent.create(newIncumbent)
                                } else {
                                    await Incumbent.findOneAndUpdate({ name: data.writers[i] }, { $push: { movie: data.title } })
                                }
                            })
                    }

                    for (let i = 0; i <= data.casts.length - 1; i++) {
                        await Incumbent.findOne({ name: data.casts[i] })
                            .then(async dataIncumbent => {
                                if (!dataIncumbent) {
                                    let newIncumbent = {
                                        name: data.casts[i],
                                        movie: data.title
                                    }
                                    await Incumbent.create(newIncumbent)
                                } else {
                                    await Incumbent.findOneAndUpdate({ name: data.casts[i] }, { $push: { movie: data.title } })
                                }
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
                    .then(data => {
                        if (!data) return reject('the movie doesn\'t exist in database')
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

            let params = {
                title: bodyParams.title,
                year: bodyParams.year,
                synopsis: bodyParams.synopsis,
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

    static addIncumbent(movieId, editor, role, bodyParams) {
        return new Promise((resolve, reject) => {
            if (role != 'ADMIN') return reject("You're not allowed to edit movie information")

            let movieTitle
            this.findById(movieId)
                .then(movie => {
                    if (!movie) return reject('Cannot find movie!')
                    let params = ['casts', 'directors', 'writers']
                    for (let i = 0; i < params.length; i++) {
                        if ((movie[params[i]].indexOf(bodyParams.name)) >= 0) return reject(`This incumbent was already added to this movie's ${params[i]}`)
                    }

                    movieTitle = movie.title
                })
                .catch(err => {
                    reject(err)
                })

            let pushData
            Incumbent.findOne({ 'name': bodyParams.name })
                .then(incumbent => {
                    if (!incumbent) return reject(`There is no incumbent with name '${bodyParams.name}' in the database`)
                    pushData = incumbent.name
                    incumbent.movie.push(movieTitle)
                    incumbent.save()
                })

            this.findById(movieId)
                .then(movie => {
                    movie[`${bodyParams.occupation}`].push(pushData)
                    movie.save()
                    movie.lastUpdatedBy = editor
                    resolve(movie)
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
                    if (!movie) return reject('this movie is not exist in our database, please input a valid movie id')
                    resolve({ message: `Movie '${movie.title}' successfuly deleted` })
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    static copyMovie(movieId, author, role) {
        return new Promise((resolve, reject) => {
            if (role !== 'ADMIN') return reject('You are not Authorized')
            axios.get(`http://www.omdbapi.com/?apikey=4a5e611c&i=` + movieId)
                .then(data => {
                    this.findOne({ title: data.data.Title })
                        .then(foundData => {

                            if (foundData) return reject('Movie already exist in the database!')

                            let movieData = data.data;
                            console.log(movieData);

                            let movie = {
                                title: movieData.Title,
                                duration: movieData.Runtime,
                                genres: [],
                                directors: [],
                                writers: [],
                                casts: [],
                                synopsis: movieData.Plot,
                                poster: movieData.Poster,
                                addedBy: author,
                                lastUpdatedBy: author
                            }

                            //==============YEAR==================
                            var minIndex = movieData.Year.indexOf("–")
                            if (minIndex > -1) {
                                var yearSplit = movieData.Year.split(',')
                                for (let i = 0; i <= yearSplit.length - 1; i++) {
                                    let newYear = yearSplit[i].split('-')
                                    newYear = parseInt(newYear[0])
                                    movie.year = newYear
                                }
                            } else {
                                movie.year = movieData.Year
                            }
                            //==============DIRECTOR==================
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
                            noDuplicateDirectors.map(item => movie.directors.push(item))

                            //==============GENRE====================
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
                            noDuplicateGenre.map(item => movie.genres.push(item))
                            //================WRITER==================
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
                            noDuplicateWriter.map(item => movie.writers.push(item))
                            //================CAST/ACTOR==================
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
                            noDuplicateCast.map(item => movie.casts.push(item))

                            //=============================================

                            this.create(movie).then(async data => {

                                for (let i = 0; i <= data.directors.length - 1; i++) {
                                    await Incumbent.findOne({ name: data.directors[i] })
                                        .then(async dataIncumbent => {
                                            if (!dataIncumbent) {
                                                let newIncumbent = {
                                                    name: data.directors[i],
                                                    movie: data.title
                                                }
                                                if (data.directors[i] !== 'N/A') {
                                                    await Incumbent.create(newIncumbent)
                                                }
                                            } else {
                                                await Incumbent.findOneAndUpdate({ name: data.directors[i] }, { $push: { movie: data.title } })
                                            }
                                        })
                                }
                                for (let i = 0; i <= data.writers.length - 1; i++) {
                                    await Incumbent.findOne({ name: data.writers[i] })
                                        .then(async dataIncumbent => {
                                            if (!dataIncumbent) {
                                                let newIncumbent = {
                                                    name: data.writers[i],
                                                    movie: data.title
                                                }
                                                await Incumbent.create(newIncumbent)
                                            } else {
                                                await Incumbent.findOneAndUpdate({ name: data.writers[i] }, { $push: { movie: data.title } })
                                            }
                                        })
                                }
                                for (let i = 0; i <= data.casts.length - 1; i++) {
                                    await Incumbent.findOne({ name: data.casts[i] })
                                        .then(async dataIncumbent => {
                                            if (!dataIncumbent) {
                                                let newIncumbent = {
                                                    name: data.casts[i],
                                                    movie: data.title
                                                }
                                                await Incumbent.create(newIncumbent)
                                            } else {
                                                await Incumbent.findOneAndUpdate({ name: data.casts[i] }, { $push: { movie: data.title } })
                                            }
                                        })
                                }
                                resolve(data)
                            })
                        })
                })
                .catch(err => {
                    reject(err)
                })
        })
    }
}

module.exports = Movie