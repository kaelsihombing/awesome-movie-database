const multer = require('multer')
var uploader;

uploader = multer().single('image')

module.exports = uploader;