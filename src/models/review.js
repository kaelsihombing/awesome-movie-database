const mongoose = require('mongoose')
const Schema = mongoose.Schema

const mongoosePaginate = require('mongoose-paginate-v2');

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
        enum: [1,2,3,4,5,6,7,8,9,10],
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
        return new Promise ((resolve, reject) => {
            let params = {
                title: bodyParams.title,
                description: bodyParams.description,
                rating: bodyParams.rating,
                author: author,
                movieId: movieId
            }

            this.create(params)
                .then(data => {
                    resolve(data)
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

            this.find({movieId: movieId})
                .then(data => {
                    let lastPage = Math.ceil(data.length / 10)
                    if (lastPage == 0) lastPage = 1
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
}

module.exports = Review