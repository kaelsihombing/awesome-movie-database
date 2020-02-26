const mongoose = require('mongoose')
const Schema = mongoose.Schema

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

    static update(id, editor, role, bodyParams) {
        return new Promise((resolve, reject) => {
            if (role != 'ADMIN') return reject("You're not allowed to edit movie information")

            let params = {
                title: bodyParams.title,
                year: bodyParams.year,
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

    static addPeople(id, editor, role, bodyParams) {
        return new Promise((resolve, reject) => {
            if (role != 'ADMIN') return reject("You're not allowed to edit movie information")

            let pushParams = {
                genre: bodyParams.genre,
                casts: bodyParams.casts,
                directors: bodyParams.directors,
                writers: bodyParams.writers,
            }
            for (let prop in pushParams) if (!pushParams[prop]) delete pushParams[prop]

            this.findById(id)
                .then(data => {
                    for (let prop in pushParams){
                        data[prop].push(pushParams[prop])
                    }
                    data.save()
                    data.lastUpdatedBy = editor
                    resolve(data)
                })
                .catch(err => {
                    reject(err)
                })
        })
    }
}

module.exports = Movie