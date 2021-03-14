const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article');
const authController = require('../controllers/auth');
const validate = require('../middleware/validate');
const dummyProtect = require('../middleware/dummy-protect');


// Routes for /
router.get('/', articleController.getIndex);

router.get('/login', authController.getLogin);
router.get('/dummy-login', authController.getDummyLogin);
router.get('/signup', authController.getSignup);
router.post('/signup', validate.signUpForm, authController.postSignup);
router.post('/login', validate.loginForm, authController.postLogin);
router.get('/logout', authController.getLogout);
router.get('/forgot-password', authController.getForgotPassword);
router.post('/forgot-password', dummyProtect, authController.postForgotPassword);
router.get('/reset-password/:token',authController.getResetPassword);
router.post('/reset-password', dummyProtect, authController.postResetPassword);

module.exports = router;