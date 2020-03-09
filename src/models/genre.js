const mongoose = require('mongoose')
const Schema = mongoose.Schema

// const mongoosePaginate = require('mongoose-paginate-v2');

const genreSchema = new Schema({
    genre: {
        type: String,
        required: true,
        unique: true
    },
    movie: [{
        type: Object
    }]
},
    {
        versionKey: false,
        timestamps: true,
    }
)

// genreSchema.plugin(mongoosePaginate)

class Genre extends mongoose.model('Genre', genreSchema) {
    static allGenre(){
        return new Promise((resolve, reject) => {
            this.find({})
                .select('genre')
                .then(data => {
                    resolve(data)
                })
        })
    }

    static filterByGenre(genre) {
        return new Promise((resolve, reject) => {
            this.findOne({ genre: genre })
                .then(data => {
                    if (!data) return reject(`${genre} genre doesn't exist!`)
                    resolve({
                        genre: data.genre,
                        movies: data.movie
                    })
                })
        })
    }
}

module.exports = Genre