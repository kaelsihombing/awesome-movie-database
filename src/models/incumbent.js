const mongoose = require('mongoose')
const Schema = mongoose.Schema

const mongoosePaginate = require('mongoose-paginate-v2');

const incumbentSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    birthDate: {
        type: Date,
    },
    age: {
        type: Number,
    },
    image: {
        type: String,
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

incumbentSchema.plugin(mongoosePaginate)

class Incumbent extends mongoose.model('Incumbent', incumbentSchema) {
    static register(role, bodyParams) {
        return new Promise((resolve, reject) => {
            if (role != 'ADMIN') reject("You're not allowed to add new incumbent")

            let params = {
                name: bodyParams.name,
            }
            this.findOne({name: bodyParams.name})
                .then(found => {
                    if (found) reject("This incumbent was already added")
                    else {
                        this.create(params)
                        .then(data => {
                            resolve(data)
                        })
                    }
                })
        })
    }

    static show(role, pagination, page) {
        return new Promise((resolve) => {
            if (role != 'ADMIN') return reject("You're not allowed to see incumbent list")
            let options = {
                page: page,
                limit: 10,
                pagination: JSON.parse(pagination),
                sort: '-updatedAt',
                collation: { locale: 'en' }
            }
            

            this.find({})
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
}

module.exports = Incumbent