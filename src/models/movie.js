const mongoose = require('mongoose')
const Schema = mongoose.Schema

const movieSchema = new Schema({
    title: {
        type: String,
        required: true,
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
        type: String,
    }],
    writers: [{
        type: String,
    }],
    casts: [{
        type: String,
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
    review: {
        type: Schema.Types.ObjectId,
        ref: 'Review',
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

class Movie extends mongoose.model('Movie', movieSchema) {

}

module.exports = Movie