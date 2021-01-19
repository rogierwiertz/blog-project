const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');

// Routes for /article
router.get('/get-comments', articleController.getComments);
router.get('/latest-articles/:articleId', articleController.getLatestArticles);
router.get('/:id', articleController.getArticle);
router.post('/add-comment', authenticate, validate.addCommentForm, articleController.postAddComment);
router.delete('/delete-comment', authenticate, articleController.deleteDeleteComment);
router.patch('/like-article', authenticate, articleController.patchLikeArticle);

module.exports = router;