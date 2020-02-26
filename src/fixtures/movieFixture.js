const faker = require('faker')

function create() {
    return{
            title: faker.lorem.sentence(),
            year: faker.random.number({'min': 1500, 'max': new Date().getFullYear()}),
    }
}

module.exports = {
    create,
}