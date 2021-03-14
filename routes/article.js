const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const dummyProtect = require('../middleware/dummy-protect');

// Routes for /article
router.get('/get-comments', articleController.getComments);
router.get('/latest-articles/:articleId', articleController.getLatestArticles);
router.get('/:id', articleController.getArticle);
router.post('/add-comment', authenticate, dummyProtect('json'), validate.addCommentForm, articleController.postAddComment);
router.delete('/delete-comment', authenticate, dummyProtect('json'), articleController.deleteDeleteComment);
router.patch('/like-article', authenticate, dummyProtect('json'), articleController.patchLikeArticle);

module.exports = router;