const faker = require('faker')

function create() {
    return {
        title: faker.lorem.sentence(),
        year: faker.random.number({ 'min': 1500, 'max': new Date().getFullYear() }),
        synopsis: faker.lorem.paragraph(),
        genres: `${faker.random.word()},${faker.random.word()},${faker.random.word()},${faker.random.word()}`,
        casts:  `${faker.name.firstName()},${faker.name.firstName()},${faker.name.firstName()},${faker.name.firstName()}`,
        writers: `${faker.name.firstName()},${faker.name.firstName()},${faker.name.firstName()},${faker.name.firstName()}`,
        directors: `${faker.name.firstName()},${faker.name.firstName()},${faker.name.firstName()},${faker.name.firstName()}`,
    }
}

module.exports = {
    create,
}