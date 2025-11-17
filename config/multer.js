// config/multer.js
const multer = require('multer');

const storage = multer.memoryStorage();  // store files as buffer

module.exports = multer({ storage });
