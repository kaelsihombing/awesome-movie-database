const faker = require('faker')

function create() {
    return {
        title: faker.lorem.sentence(),
        description: faker.lorem.sentence(),
        rating: faker.random.number({ 'min': 1, 'max': 10 }),
    }
}

module.exports = {
    create,
}