const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    article: {
        type: Schema.Types.ObjectId,
        ref: 'article',
        required: true
    }
    
}, {timestamps: {}});



module.exports = mongoose.model('comment', commentSchema);