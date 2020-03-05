const supertest = require('supertest')
const mongoose = require('mongoose')
require('dotenv').config()

const server = require('../src/server.js')
const request = supertest(server)

const User = require('../src/models/user.js')
const userFixtures = require('../src/fixtures/userFixture.js')
const staticUser = userFixtures.create()
const staticAdmin = userFixtures.create()

async function removeAllCollections() {
    const collections = Object.keys(mongoose.connection.collections)
    for (const collectionName of collections) {
        const collection = mongoose.connection.collections[collectionName]
        await collection.deleteMany()
    }
}

async function dropAllCollections() {
    const collections = Object.keys(mongoose.connection.collections)
    for (const collectionName of collections) {
        const collection = mongoose.connection.collections[collectionName]
        try {
            await collection.drop()
        } catch (error) {
            // Sometimes this error happens, but you can safely ignore it
            if (error.message === 'ns not found') return
            // This error occurs when you use it.todo. You can
            // safely ignore this error too
            if (error.message.includes('a background operation is currently running')) return
            console.log(error.message)
        }
    }
}

beforeAll(async (done) => {
    mongoose
        .connect(process.env.DB_CONNECTION_TEST, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false
        })
        .then(() => {
            console.log('connected')
        })
        .catch(err => console.error(err))
    await removeAllCollections()

    done()
})

afterAll(async (done) => {
    await dropAllCollections()
    await mongoose.connection.close()
    done()
})

describe('/POST /api/v1/admins', () => {
    it('Should create a new admin', async done => {
        staticAdmin.password_confirmation = staticAdmin.password
        request
            .post('/api/v1/admins')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .then(res => {
                expect(res.status).toBe(201)
                let { success, data } = res.body
                expect(success).toBe(true)
                done()
            })
    })
})

describe('/POST /api/v1/users', () => {
    it("Should not create a new user due to password and confirmation doesn't match", async done => {
        request
            .post('/api/v1/users')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                expect(res.status).toBe(422)
                let { success, data } = res.body
                expect(success).toBe(false)
                done()
            })
    })

    it('Should create a new user', async done => {
        staticUser.password_confirmation = staticUser.password
        request
            .post('/api/v1/users')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                expect(res.status).toBe(201)
                let { success, data } = res.body
                expect(success).toBe(true)
                done()
            })
    })

    it('Should not create a new user due to email duplication', async done => {
        staticUser.password_confirmation = staticUser.password
        request
            .post('/api/v1/users')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                expect(res.status).toBe(422)
                let { success, data } = res.body
                expect(success).toBe(false)
                done()
            })
    })
})

describe('/POST /api/v1/auth', () => {
    it('Should successfully logged in user', async done => {
        request
            .post('api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                expect(res.status).toBe(200)
                let { success, data } = res.body
                expect(success).toBe(true)
                done()
            })
    })

    it('Should not successfully logged in user because user does not exist', async done => {
        staticUser.email = "example@mail.com"
        request
            .post('api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                expect(res.status).toBe(422)
                let { success, data } = res.body
                expect(success).toBe(false)
                done()
            })
    })
})

describe('/PUT /api/v1/users', () => {
    it('Should successfully update user profile', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                console.log(res.body);
                
                let token = res.body.data.token
                let update = userFixtures.create()
                delete update.email
                delete update.password_confirmation
                request
                    .put('/api/v1/users')
                    .set('Content-Type', 'application/json')
                    .send(JSON.stringify(update))
                    .then(res => {
                        console.log(res.body);
                        expect(res.status).toBe(201)
                        let { success, data } = res.body
                        expect(success).toBe(true)
                        done()
                    })
            })
    })
})