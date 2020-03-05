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

const Movie = require('../src/models/movie.js')
const movieFixtures = require('../src/fixtures/movieFixture.js')
const staticMovie = movieFixtures.create()

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

describe('Create admin and then movie', () => {
    it('Should create a new admin and create movie', async done => {
        staticAdmin.password_confirmation = staticAdmin.password
        request
            .post('/api/v1/admins')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .then(res => {
                let token = res.body.data.token
                request
                    .post('/api/v1/movies')
                    .set('Content-Type', 'application/json')
                    .set('Authorization', token)
                    .send(JSON.stringify(staticMovie))
                    .then(res => {
                        expect(res.status).toBe(201)
                        let { success, data } = res.body
                        expect(success).toBe(true)
                        done()
                    })
            })
    })
})

describe('Create user no 2', () => {
    it('Should create a new user', async done => {
        staticUser2.password_confirmation = staticUser2.password
        request
            .post('/api/v1/users')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser2))
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

// describe('/POST /api/v1/auth', () => {
//     it('Should successfully logged in user', async done => {
//         request
//             .post('api/v1/auth')
//             .set('Content-Type', 'application/json')
//             .send(JSON.stringify(staticUser))
//             .then(res => {
//                 // done()
//             })
//     })

//     it('Should not successfully logged in user because user does not exist', async done => {
//         staticUser.email = "example@mail.com"
//         request
//             .post('api/v1/auth')
//             .set('Content-Type', 'application/json')
//             .send(JSON.stringify(staticUser))
//             .then(res => {
//                 expect(res.status).toBe(422)
//                 let { success, data } = res.body
//                 expect(success).toBe(false)
//                 done()
//             })
//     })
// })

// describe('GET /verified/:token', () => {
//     it('Should verifiy a user', async done => {

//     })
// })

describe('/PUT /api/v1/users', () => {
    it('Should successfully update user profile', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                let update = userFixtures.create()
                delete update.email
                delete update.password_confirmation
                request
                    .put('/api/v1/users')
                    .set('Content-Type', 'application/json')
                    .set('Authorization', token)
                    .send(JSON.stringify(update))
                    .then(res => {
                        expect(res.status).toBe(422)
                        let { success, data } = res.body
                        expect(success).toBe(false)
                        done()
                    })
            })
    })
})

describe('POST /api/v1/watchlist', () => {
    it('Should add a movie to watchlist', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/movies/all')
                    .query({ pagination: false })
                    .then(res => {
                        let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                        let movieId = res.body.data.docs[i]._id
                        request
                            .post('/api/v1/watchlist')
                            .set('Authorization', token)
                            .query({ movieId: movieId })
                            .then(res => {
                                expect(res.status).toBe(201)
                                let { success, data } = res.body
                                expect(success).toBe(true)
                                done()
                            })
                    })
            })
    })

    it('Should not add a movie to watchlist due to title was already in watchlist', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/movies/all')
                    .query({ pagination: false })
                    .then(res => {
                        let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                        let movieId = res.body.data.docs[i]._id
                        request
                            .post('/api/v1/watchlist')
                            .set('Authorization', token)
                            .query({ movieId: movieId })
                            .then(res => {
                                request
                                    .post('/api/v1/watchlist')
                                    .set('Authorization', token)
                                    .query({ movieId: movieId })
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

    it('Should not add a movie to watchlist due to invalid movieId', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/movies/all')
                    .query({ pagination: false })
                    .then(res => {
                        let movieId = 'movieId'
                        request
                            .post('/api/v1/watchlist')
                            .set('Authorization', token)
                            .query({ movieId: movieId })
                            .then(res => {
                                expect(res.status).toBe(422)
                                let { success, error } = res.body
                                expect(success).toBe(false)
                                done()
                            })
                    })
            })
    })
})

describe('GET /api/v1/watchlist', () => {
    it("Should show user's watchlist", async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/watchlist')
                    .set('Authorization', token)
                    .then(res => {
                        expect(res.status).toBe(200)
                        let { success, data } = res.body
                        expect(success).toBe(true)
                        done()
                    })
            })
    })

    it("Should return user has no movie in watchlist", async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser2))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/watchlist')
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


describe('DELETE /api/v1/watchlist', () => {
    it('Should not delete one movie from user watchlist due to invalid movieId', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/watchlist')
                    .set('Authorization', token)
                    .then(res => {
                        let movieId = 'randomId'
                        request
                            .delete('/api/v1/watchlist')
                            .set('Authorization', token)
                            .query({ movieId: movieId })
                            .then(res => {
                                expect(res.status).toBe(422)
                                let { success, error } = res.body
                                expect(success).toBe(false)
                                done()
                            })
                    })
            })
    }) 

    it('Should delete one movie from user watchlist', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/watchlist')
                    .set('Authorization', token)
                    .then(res => {
                        let i = Math.floor(Math.random() * (res.body.data.watchList.length - 1))
                        let movieId = res.body.data.watchList[i]._id
                        request
                            .delete('/api/v1/watchlist')
                            .set('Authorization', token)
                            .query({ movieId: movieId })
                            .then(res => {
                                expect(res.status).toBe(201)
                                let { success, data } = res.body
                                expect(success).toBe(true)
                                done()
                            })
                    })
            })
    })
})