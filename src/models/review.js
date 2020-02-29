const mongoose = require('mongoose')
const Schema = mongoose.Schema

const mongoosePaginate = require('mongoose-paginate-v2')

const Movies = require('./movie.js')
const User = require('./user.js')

const reviewSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        required: true,
    },
    movieId: {
        type: Schema.Types.ObjectId,
        ref: 'Movie'
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
},
    {
        versionKey: false,
        timestamps: true,
    }
)

reviewSchema.plugin(mongoosePaginate)

class Review extends mongoose.model('Review', reviewSchema) {
    static register(author, movieId, bodyParams) {
        return new Promise((resolve, reject) => {
            User.findById(author)
                .then(user => {
                    let movieCheck = user.reviews.indexOf(movieId) > 0
                    if (movieCheck) return reject("You've created a review for this movie")
                })

            let params = {
                title: bodyParams.title,
                description: bodyParams.description,
                rating: bodyParams.rating,
                author: author,
                movieId: movieId,
            }

            let pushData

            this.create(params)
                .then(review => {
                    pushData = review._id
                    resolve(review)
                })

            User.findById(author)
                .then(user => {
                    user.reviews.push(pushData)
                    user.save()
                })

            Movies.findById(movieId)
                .then(movie => {
                    movie.reviews.push(pushData)
                    movie.save()
                })
        })
    }

    static myReview(author, pagination, page) {
        return new Promise((resolve, reject) => {
            let options = {
                page: page,
                limit: 10,
                pagination: JSON.parse(pagination),
                sort: '-updatedAt',
                collation: { locale: 'en' }
            }

            this.find({ author: author })
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

    static movieReview(movieId, pagination, page) {
        return new Promise((resolve, reject) => {
            let options = {
                page: page,
                limit: 10,
                pagination: JSON.parse(pagination),
                sort: '-updatedAt',
                collation: { locale: 'en' }
            }

            this.find({ movieId: movieId })
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

    static editReview(author, reviewId, bodyParams) {
        return new Promise((resolve, reject) => {
            let params = {
                title: bodyParams.title,
                description: bodyParams.description,
                rating: bodyParams.rating,
            }
            for (let prop in params) if (!params[prop]) delete params[prop]

            this.findOneAndUpdate({author: author, _id: reviewId}, params, {new: true})
                .then(data => {
                    resolve(data)
                })
                .catch(err => {
                    reject(err)
                })
        })
    }
}

module.exports = Review