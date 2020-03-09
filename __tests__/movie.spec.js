const supertest = require('supertest')
const mongoose = require('mongoose')
require('axios')
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
const staticMovie2 = movieFixtures.create()

const Review = require('../src/models/review.js')
const reviewFixtures = require('../src/fixtures/reviewFixture.js')
const staticReview = reviewFixtures.create()

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
                let { success, data } = res.body
                expect(success).toBe(true)
                done()
            })
    })
})

describe('Create 2nd user', () => {
    it('Should create a new user (2nd)', async done => {
        staticUser2.password_confirmation = staticUser2.password
        request
            .post('/api/v1/users')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser2))
            .then(res => {
                let { success, data } = res.body
                expect(success).toBe(true)
                done()
            })
    })
})

describe('POST /api/v1/movies', () => {
    it('Should login admin and successfully create movie', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .then(res => {
                let token = res.body.data.token
                let movieSample = movieFixtures.create()
                request
                    .post('/api/v1/movies')
                    .set('Content-Type', 'application/json')
                    .set('Authorization', token)
                    .send(JSON.stringify(movieSample))
                    .then(res => {
                        expect(res.status).toBe(201)
                        let { success, data } = res.body
                        expect(success).toBe(true)
                        done()
                    })
            })
    })

    it('Should successfully create movie with only required information', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .then(res => {
                let token = res.body.data.token
                let movieSample = movieFixtures.create()
                delete movieSample.genres
                delete movieSample.directors
                delete movieSample.writers
                delete movieSample.casts
                request
                    .post('/api/v1/movies')
                    .set('Content-Type', 'application/json')
                    .set('Authorization', token)
                    .send(JSON.stringify(movieSample))
                    .then(res => {
                        expect(res.status).toBe(201)
                        let { success, data } = res.body
                        expect(success).toBe(true)
                        done()
                    })
            })
    })

    it('Should failed to create movie due to missing information', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .then(res => {
                let token = res.body.data.token
                let movieSample = movieFixtures.create()
                delete movieSample.title
                delete movieSample.year
                request
                    .post('/api/v1/movies')
                    .set('Content-Type', 'application/json')
                    .set('Authorization', token)
                    .send(JSON.stringify(movieSample))
                    .then(res => {
                        expect(res.status).toBe(422)
                        let { success, data } = res.body
                        expect(success).toBe(false)
                        done()
                    })
            })
    })

    it('Should login user and failed to create movie', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                let movieSample = movieFixtures.create()
                request
                    .post('/api/v1/movies')
                    .set('Content-Type', 'application/json')
                    .set('Authorization', token)
                    .send(JSON.stringify(movieSample))
                    .then(res => {
                        expect(res.status).toBe(422)
                        let { success, data } = res.body
                        expect(success).toBe(false)
                        done()
                    })
            })
    })
})

describe('GET /api/v1/movies/all', () => {
    it('Should show all movies paginated to 10 per page', async done => {
        request
            .get('/api/v1/movies/all')
            .query({ pagination: false })
            .then(res => {
                let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                let page = Math.ceil(Math.random() * (lastPage))
                request
                    .get('/api/v1/movies/all')
                    .query({ page: page })
                    .then(res => {
                        expect(res.status).toBe(200)
                        let { success, data } = res.body
                        expect(success).toBe(true)
                        done()
                    })
            })
    })

    it('Should show page 1 of all movies due to invalid page', async done => {
        request
            .get('/api/v1/movies/all')
            .query({ pagination: false })
            .then(res => {
                let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                let page = lastPage + 1
                request
                    .get('/api/v1/movies/all')
                    .query({ page: page })
                    .then(res => {
                        expect(res.status).toBe(200)
                        let { success, data } = res.body
                        expect(success).toBe(true)
                        done()
                    })
            })
    })
})

describe('GET /api/v1/movies', () => {
    it('Should show specific movie', async done => {
        request
            .get('/api/v1/movies/all')
            .query({ pagination: false })
            .then(res => {
                let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                let movieId = res.body.data.docs[i]._id
                request
                    .get('/api/v1/movies')
                    .query({ movieId: movieId })
                    .then(res => {
                        expect(res.status).toBe(200)
                        let { success, data } = res.body
                        expect(success).toBe(true)
                        done()
                    })
            })
    })

    it('Should not show specific movie due to invalid movieId', async done => {
        request
            .get('/api/v1/movies/all')
            .then(res => {
                let movieId = 'movieId'
                request
                    .get('/api/v1/movies')
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

describe('PUT /api/v1/movies', () => {
    it('Should update existing movie information', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/movies/all')
                    .query({ pagination: false })
                    .then(res => {
                        let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                        let movieId = res.body.data.docs[i]._id
                        let update = movieFixtures.create()
                        delete update.year
                        request
                            .put('/api/v1/movies')
                            .set('Content-Type', 'application/json')
                            .set('Authorization', token)
                            .query({ movieId: movieId })
                            .send(JSON.stringify(update))
                            .then(res => {
                                expect(res.status).toBe(201)
                                let { success, data } = res.body
                                expect(success).toBe(true)
                                done()
                            })
                    })
            })
    })

    it('Should not update existing movie information due to invalid movieId', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/movies/all')
                    .query({ pagination: false })
                    .then(res => {
                        let movieId = 'movieId'
                        let update = movieFixtures.create()
                        delete update.year
                        request
                            .put('/api/v1/movies')
                            .set('Content-Type', 'application/json')
                            .set('Authorization', token)
                            .query({ movieId: movieId })
                            .send(JSON.stringify(update))
                            .then(res => {
                                expect(res.status).toBe(422)
                                let { success, error } = res.body
                                expect(success).toBe(false)
                                done()
                            })
                    })
            })
    })

    it('Should not update existing movie information', async done => {
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
                        let update = movieFixtures.create()
                        delete update.year
                        request
                            .put('/api/v1/movies')
                            .set('Content-Type', 'application/json')
                            .set('Authorization', token)
                            .query({ movieId: movieId })
                            .send(JSON.stringify(update))
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

describe('DELETE /api/v1/movies', () => {
    it('Should not delete a movie because of unauthorized user', async done => {
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
                            .delete('/api/v1/movies')
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

    it('Should not delete a movie because of invalid movieId', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/movies/all')
                    .query({ pagination: false })
                    .then(res => {
                        let movieId = 'movieId'
                        request
                            .delete('/api/v1/movies')
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

    it('Should delete a movie', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/movies/all')
                    .query({ pagination: false })
                    .then(res => {
                        let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                        let movieId = res.body.data.docs[i]._id
                        request
                            .delete('/api/v1/movies')
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

describe('GET /api/v1/imdbmovie', () => {
    it('Should get movie information from IMDB', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/imdbmovie')
                    .set('Authorization', token)
                    //query imdb movie id (ex. 8 Mile movie id is tt0298203)
                    .query({ i: 'tt0298203' })
                    .then(res => {
                        expect(res.status).toBe(201)
                        let { success, data } = res.body
                        expect(success).toBe(true)
                        done()
                    })
            })
    })
})

describe('GET /api/v1/movies/genre', () => {
    it('Should get movie by genre', async done => {
        request
            .get('/api/v1/movies/all')
            .then(res => {
                let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                let j = Math.floor(Math.random() * (res.body.data.docs[i].genres.length - 1))
                let genre = res.body.data.docs[i].genres[j].genre
                request
                    .get('/api/v1/movies/genre')
                    .query({ genre: genre })
                    .then(res => {
                        expect(res.status).toBe(200)
                        let { success, data } = res.body
                        expect(success).toBe(true)
                        done()
                    })
            })
    })

    it('Should not get movie by genre because genre does not exist', async done => {
        let genre = 'genre'
        request
            .get('/api/v1/movies/genre')
            .query({ genre: genre })
            .then(res => {
                expect(res.status).toBe(422)
                let { success, error } = res.body
                expect(success).toBe(false)
                done()
            })
    })
})

describe('GET /api/v1/movies/title', () => {
    it('Should show filtered movie by title', async done => {
        request
            .get('/api/v1/movies/all')
            .query({ pagination: false })
            .then(res => {
                let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                let title = res.body.data.docs[i].title
                request
                    .get('/api/v1/movies/title')
                    .query({ title: title })
                    .then(res => {
                        expect(res.status).toBe(200)
                        let { success, data } = res.body
                        expect(success).toBe(true)
                        done()
                    })
            })
    })

    it('Should not show filtered movie by title', async done => {
        request
            .get('/api/v1/movies/all')
            .query({ pagination: false })
            .then(res => {
                let title = 'title'
                request
                    .get('/api/v1/movies/title')
                    .query({ title: title })
                    .then(res => {
                        expect(res.status).toBe(422)
                        let { success, error } = res.body
                        expect(success).toBe(false)
                        done()
                    })
            })
    })
})

describe('GET /api/v1/movies/popular', () => {
    it('Should sort movies by rating', async done => {
        request
            .get('/api/v1/movies/all')
            .query({ pagination: false })
            .then(res => {
                let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                let page = Math.ceil(Math.random() * (lastPage))
                request
                    .get('/api/v1/movies/popular')
                    .query({ sortingBy: 'rating' })
                    .then(res => {
                        expect(res.status).toBe(200)
                        let { success, data } = res.body
                        expect(success).toBe(true)
                        done()
                    })
            })
    })

    it('Should how page 1 of sorted movies by rating', async done => {
        request
            .get('/api/v1/movies/all')
            .query({ pagination: false })
            .then(res => {
                let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                let page = lastPage + 1
                request
                    .get('/api/v1/movies/popular')
                    .query({ sortingBy: 'rating', page: page })
                    .then(res => {
                        expect(res.status).toBe(200)
                        let { success, data } = res.body
                        expect(success).toBe(true)
                        done()
                    })
            })
    })
})


describe('GET /api/v1/genres', () => {
    it('Should get all movie genres', async done => {
        request
            .get('/api/v1/movies/allgenre')
            .then(res => {
                expect(res.status).toBe(200)
                let { success, data } = res.body
                expect(success).toBe(true)
                done()
            })
    })
})