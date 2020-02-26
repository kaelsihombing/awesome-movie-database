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
    static register(creator, title, year, ) {
        return new Promise((resolve, reject) => {
            let params = {
                title: title,
                year: year,
                addedBy: creator,
                lastUpdatedBy: creator,
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
}

module.exports = Movie