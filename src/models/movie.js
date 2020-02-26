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
    static register(creator, role, title, year) {
        return new Promise((resolve, reject) => {
            if (role != 'ADMIN') return reject("You're not allowed to add movie entry")

            let params = {
                title: title,
                year: year,
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
}

module.exports = Movie