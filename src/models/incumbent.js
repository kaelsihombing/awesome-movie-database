const mongoose = require('mongoose')
const Schema = mongoose.Schema

const mongoosePaginate = require('mongoose-paginate-v2');

const incumbentSchema = new Schema ({
    name: {
        type: String,
        required: true,
    },
    birthDate: {
        type: Date,
    },
    age:  {
        type: Number
    },
    occupation: {
        type: String,
        enum: ['Cast','Director','Writer','Producer'],
        required: true,
    }
},
    {
        versionKey: false,
        timestamps: true,
    }
)

incumbentSchema.plugin(mongoosePaginate)

class Incumbent extends mongoose.model('Incumbent', incumbentSchema) {
    static register(role, bodyParams) {
        return new Promise ((resolve, reject) => {
            if (role != 'ADMIN') return reject("You're not allowed to add new incumbent")
            
            this.create(bodyParams)
            .then(data => {
                resolve(data)
            })
            .catch(err => {
                reject(err)
            })
        })
    }
}

module.exports = Incumbent