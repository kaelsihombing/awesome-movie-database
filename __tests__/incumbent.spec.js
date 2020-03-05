const supertest = require('supertest')
const mongoose = require('mongoose')
require('dotenv').config()

const server = require('../src/server.js')
const request = supertest(server)

const User = require('../src/models/user.js')
const userFixtures = require('../src/fixtures/userFixture.js')
const staticUser = userFixtures.create()
const staticUser2 = userFixtures.create()
const staticAdmin = userFixtures.create()

const Incumbent = require('../src/models/incumbent.js')
const incumbentFixtures = require('../src/fixtures/incumbentFixture.js')
const staticIncumbent = incumbentFixtures.create()

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

describe('Create admin', () => {
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

describe('Create user', () => {
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
})

describe('POST /api/v1/incumbents', () => {
    it('Should add new incumbent', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .then(res => {
                let token = res.body.data.token
                request
                    .post('/api/v1/incumbents')
                    .set('Content-Type', 'application/json')
                    .set('Authorization', token)
                    .send(JSON.stringify(staticIncumbent))
                    .then(res => {
                        expect(res.status).toBe(201)
                        let { success, data } = res.body
                        expect(success).toBe(true)
                        done()
                    })
            })
    })

    it('Should not add new incumbent', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .post('/api/v1/incumbents')
                    .set('Content-Type', 'application/json')
                    .set('Authorization', token)
                    .send(JSON.stringify(staticIncumbent))
                    .then(res => {
                        expect(res.status).toBe(422)
                        let { success, data } = res.body
                        expect(success).toBe(false)
                        done()
                    })
            })
    })

    it('Should not add new incumbent', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .then(res => {
                let token = res.body.data.token
                let incumbentSample = incumbentFixtures.create()
                request
                    .post('/api/v1/incumbents')
                    .set('Content-Type', 'application/json')
                    .set('Authorization', token)
                    .send(JSON.stringify(incumbentSample))
                    .then(res => {
                        request
                            .post('/api/v1/incumbents')
                            .set('Content-Type', 'application/json')
                            .set('Authorization', token)
                            .send(JSON.stringify(incumbentSample))
                            .then(res => {
                                expect(res.status).toBe(422)
                                let { success, data } = res.body
                                expect(success).toBe(false)
                                done()
                            })
                    })
            })
    })
})

describe('GET /api/v1/incumbents', () => {
    it('Should show all incumbents', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/incumbents')
                    .set('Authorization', token)
                    .then(res => {
                        expect(res.status).toBe(200)
                        let { success, data } = res.body
                        expect(success).toBe(true)
                        done()
                    })
            })
    })

    it('Should show page 1 of all incumbents', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/incumbents')
                    .query({ pagination: false })
                    .set('Authorization', token)
                    .then(res => {
                        let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                        let page = lastPage + 1
                        request
                            .get('/api/v1/incumbents')
                            .query({ page: page })
                            .set('Authorization', token)
                            .then(res => {
                                expect(res.status).toBe(200)
                                let { success, data } = res.body
                                expect(success).toBe(true)
                                done()
                            })
                    })
            })
    })

    it('Should not show all incumbents', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/incumbents')
                    .set('Authorization', token)
                    .then(res => {
                        expect(res.status).toBe(422)
                        let { success, error } = res.body
                        expect(success).toBe(false)
                        done()
                    })
            })
    })
})