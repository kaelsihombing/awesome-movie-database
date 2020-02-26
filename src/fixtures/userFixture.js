const faker = require('faker')

function create() {
    return{
            fullname: faker.name.findName(),
            email: faker.internet.email().toLowerCase(),
            password: faker.internet.password(),
            password_confirmation: faker.internet.password(),   
    }
}

module.exports = {
    create,
}