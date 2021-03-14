const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const upload = require('../middleware/uploads');
const dummyProtect = require('../middleware/dummy-protect');

// Routes for /blog
router.get('/my-articles', authenticate, articleController.getMyArticles);
router.get('/my-articles/:id', authenticate, articleController.getMyArticle);
router.get('/new-article', authenticate, articleController.getNewArticle);
router.post('/new-article', authenticate, dummyProtect(), upload.single('image'), validate.postForm,  articleController.postNewArticle);
router.patch('/publish-article', authenticate, dummyProtect('json'), articleController.patchPublishArticle);
router.patch('/unpublish-article', authenticate, dummyProtect('json'), articleController.patchUnpublishArticle);
router.delete('/delete-article/:id', authenticate, dummyProtect('json'), articleController.deleteArticle);
router.get('/update-article/:id', authenticate, articleController.getUpdateArticle);
router.post('/update-article', authenticate, dummyProtect(null, 'update-article/604e5ff97d837e1d08041ba6'), upload.single('image'), validate.postForm, articleController.postUpdateArticle);


module.exports = router;