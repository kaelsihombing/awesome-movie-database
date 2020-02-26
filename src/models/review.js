const mongoose = require('mongoose')
const Schema = mongoose.Schema

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
        min: 0,
        max: 10,
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

class Review extends mongoose.model('Review', reviewSchema) {

}

module.exports = Review