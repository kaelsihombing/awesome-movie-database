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