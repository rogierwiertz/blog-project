const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const upload = require('../middleware/uploads');

// Routes for /blog
router.get('/my-articles', authenticate, articleController.getMyArticles);
router.get('/my-articles/:id', authenticate, articleController.getMyArticle);
router.get('/new-article', authenticate, articleController.getNewArticle);
router.post('/new-article', authenticate, upload.single('image'), validate.postForm,  articleController.postNewArticle);
router.patch('/publish-article', authenticate, articleController.patchPublishArticle);
router.patch('/unpublish-article', authenticate, articleController.patchUnpublishArticle);
router.delete('/delete-article/:id', authenticate, articleController.deleteArticle);
router.get('/update-article/:id', authenticate, articleController.getUpdateArticle);
router.post('/update-article', authenticate, upload.single('image'), validate.postForm, articleController.postUpdateArticle);


module.exports = router;