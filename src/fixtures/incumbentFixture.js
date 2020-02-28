const faker = require('faker')

function create() {
    return{
            name: faker.name.findName(),
            birthDate: faker.date.past(),
    }
}

module.exports = {
    create,
}