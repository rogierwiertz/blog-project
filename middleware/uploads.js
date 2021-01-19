const multer = require('multer');
const path = require('path');

//Disk Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
});

//FileFilter
const fileFilter = (req, file, cb) => {
    const filetypes = /jpg|jpeg|png|gif/;
    const mimeType = filetypes.test(file.mimetype.toLowerCase());
    if(mimeType) {
        return cb(null, true);
    } else {
        cb(null, false);
        console.log('Not an image');
    }
}

//Upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

module.exports = upload;