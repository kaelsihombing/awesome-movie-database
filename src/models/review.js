const mongoose = require('mongoose')
const Schema = mongoose.Schema

const mongoosePaginate = require('mongoose-paginate-v2')

const Movie = require('./movie.js')
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
        enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        required: true,
    },
    movieId: {
        type: Schema.Types.ObjectId,
        ref: 'Movie',
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
            this.find({ movieId: movieId, author: author })
                .then(data => {
                    if (data.length != 0) return reject("You've already created a review for this movie")
                    else {
                        let params = {
                            title: bodyParams.title,
                            description: bodyParams.description,
                            rating: bodyParams.rating,
                            author: author,
                            movieId: movieId,
                        }

                        let pushData
                        let addRating

                        this.create(params)
                            .then(review => {
                                pushData = review._id
                                addRating = review.rating

                                User.findById(author)
                                    .then(user => {
                                        user.reviews.push(pushData)
                                        user.save()
                                    })

                                Movie.findById(movieId)
                                    .then(movie => {
                                        movie.rating = (movie.rating * movie.reviews.length) + addRating
                                        movie.reviews.push(pushData)
                                        movie.rating = movie.rating / movie.reviews.length
                                        movie.save()
                                    })

                                resolve(review)
                            })
                    }
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    static myReview(author, pagination, page) {
        return new Promise((resolve) => {
            let options = {
                page: page,
                limit: 10,
                pagination: JSON.parse(pagination),
                sort: '-updatedAt',
                populate: [{
                    path: 'movieId',
                    select: ['title']
                },
                {
                    path: 'author',
                    select: ['fullname']
                }],
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
        })
    }

    static movieReview(movieId, pagination, page) {
        return new Promise((resolve, reject) => {
            let options = {
                page: page,
                limit: 10,
                pagination: JSON.parse(pagination),
                sort: '-updatedAt',
                populate: [{
                    path: 'movieId',
                    select: ['title']
                },
                {
                    path: 'author',
                    select: ['fullname']
                }],
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

            this.findOneAndUpdate({ author: author, _id: reviewId }, params, { new: true })
                .then(data => {
                    resolve(data)
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    static destroy(author, reviewId) {
        return new Promise((resolve, reject) => {
            let subRating
            
            this.findOneAndDelete({author: author, _id:reviewId})
                .then(data => {
                    subRating = data.rating
                    User.findById(data.author)
                        .then(user => {
                            user.reviews.splice(user.reviews.indexOf(data._id), 1)
                            user.save()
                        })

                    Movie.findById(data.movieId)
                        .then(movie => {
                            movie.rating = (movie.rating * movie.reviews.length) - subRating
                            movie.reviews.splice(movie.reviews.indexOf(data._id), 1)
                            if (movie.reviews.length == 0) movie.rating = 0
                            else movie.rating = movie.rating / movie.reviews.length
                            movie.save()
                        })

                    resolve(data)
                })
                .catch(err => {
                    reject(err)
                })
        })
    }
}

module.exports = Review