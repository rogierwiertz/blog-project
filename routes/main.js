const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article');
const authController = require('../controllers/auth');
const validate = require('../middleware/validate');


// Routes for /
router.get('/', articleController.getIndex);

router.get('/login', authController.getLogin);
router.get('/signup', authController.getSignup);
router.post('/signup', validate.signUpForm, authController.postSignup);
router.post('/login', validate.loginForm, authController.postLogin);
router.get('/logout', authController.getLogout);
router.get('/forgot-password', authController.getForgotPassword);
router.post('/forgot-password', authController.postForgotPassword);
router.get('/reset-password/:token', authController.getResetPassword);
router.post('/reset-password', authController.postResetPassword);

module.exports = router;