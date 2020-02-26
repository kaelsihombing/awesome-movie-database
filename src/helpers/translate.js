const id = require('../languages/id.json')
const en = require('../languages/en.json')
const jwt = require('jsonwebtoken')
const isEmpty = require('./isEmpty')
const User = require('../models/user')

class Translate {
    static async translator(key, req = undefined) {
        const languagesList = { id, en }
        let choosedLanguage = languagesList[process.env.language];

        if (!isEmpty(req) && !isEmpty(req.headers.authorization)) {
            const token = await jwt.verify(req.headers.authorization, process.env.JWT_SIGNATURE_KEY)
            
            const user = await User.findById(token._id)
            
            choosedLanguage = !isEmpty(user) && languagesList[user.language];
        }

        return choosedLanguage[key]
    }
}

module.exports = Translate;
