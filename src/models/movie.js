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
    }

},
    {
        versionKey: false,
        timestamps: true,
    }
)

class Movie extends mongoose.model('Movie', movieSchema) {
    
}

module.exports = Movie