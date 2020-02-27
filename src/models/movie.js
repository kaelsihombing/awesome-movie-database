const mongoose = require('mongoose')
const Schema = mongoose.Schema

const mongoosePaginate = require('mongoose-paginate-v2');

let Incumbent = require('./incumbent.js')

const movieSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true,
    },
    year: {
        type: Number,
        required: true,
    },
    // duration: {
    //     type: 
    // },
    genre: [{
        type: String,
    }],
    directors: [{
        type: Schema.Types.ObjectId,
        ref: 'Incumbent',
    }],
    writers: [{
        type: Schema.Types.ObjectId,
        ref: 'Incumbent',
    }],
    casts: [{
        type: Schema.Types.ObjectId,
        ref: 'Incumbent',
    }],
    synopsis: {
        type: String,
    },
    poster: {
        type: String,
    },
    trailer: {
        type: String,
    },
    review: [{
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
            if (role != 'ADMIN') return reject("You're not allowed to add movie entry")

            let params = {
                title: bodyParams.title,
                year: bodyParams.year,
                addedBy: creator,
                lastUpdatedBy: creator,
            }

            this.create(params)
                .then(data => {
                    resolve({
                        _id: data._id,
                        title: data.title,
                        year: data.year,
                        genre: data.genre,
                        casts: data.casts,
                        directors: data.directors,
                        writers: data.writers,
                    })
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    static show(pagination, page) {
        return new Promise((resolve) => {
            let options = {
                page: page,
                limit: 10,
                pagination: JSON.parse(pagination),
                sort: '-updatedAt',
                collation: { locale: 'en' }
            }

            this.find({})
                .then(data => {
                    let lastPage = Math.ceil(data.length / 10)
                    if (lastPage == 0) lastPage = 1
                    if (options.page > lastPage || options.page < 0) options.page = 1

                    this.paginate({}, options)
                        .then(data => {
                            resolve(data)
                        })
                })
        })
    }

    static update(id, editor, role, bodyParams) {
        return new Promise((resolve, reject) => {
            if (role != 'ADMIN') return reject("You're not allowed to edit movie information")

            let params = {
                title: bodyParams.title,
                year: bodyParams.year,
                synopsis: bodyParams.synopsis,
                lastUpdatedBy: editor,
            }
            for (let prop in params) if (!params[prop]) delete params[prop]

            this.findByIdAndUpdate(id, params, { new: true })
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

            let pushData

            switch (bodyParams.occupation) {
                case "casts":
                    Incumbent.findOne({ 'name': bodyParams.name, 'occupation': 'Cast' })
                        .then(incumbent => {
                            if (!incumbent._id) return reject `There is no cast with name ${bodyParams.name} in the database`
                            pushData = incumbent._id
                        })
                    break;

                case "writers":
                    Incumbent.findOne({ 'name': bodyParams.name, 'occupation': 'Writer' })
                        .then(incumbent => {
                            if (!incumbent._id) return reject `There is no writer with name ${bodyParams.name} in the database`
                            pushData = incumbent._id
                        })
                    break;

                case "directors":
                    Incumbent.findOne({ 'name': bodyParams.name, 'occupation': 'Director' })
                        .then(incumbent => {
                            if (!incumbent._id) return reject `There is no director with name ${bodyParams.name} in the database`
                            pushData = incumbent._id
                        })
                    break;
            }

            this.findById(movieId)
                .then(movie => {
                    if (!movie._id) return reject `There is no movie with give _id`
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
}

module.exports = Movie