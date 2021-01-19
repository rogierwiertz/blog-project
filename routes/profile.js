const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const upload = require('../middleware/uploads');

// Routes for /profile
router.get('/my-profile', authenticate, profileController.getMyProfile);
router.post('/update-profile', authenticate, validate.updateProfileForm, profileController.postUpdateProfile);
router.get('/delete-account', authenticate, profileController.getDeleteAccount);
router.post('/delete-account', authenticate, validate.deleteAccountForm, profileController.postDeleteAccount);
router.post('/upload-image', authenticate, upload.single('image'), profileController.postUploadImage);
router.post('/delete-image', authenticate, profileController.postDeleteImage);
router.get('/change-password', authenticate, profileController.getChangePassword);
router.post('/change-password', authenticate, validate.changePassword, profileController.postChangePassword);
module.exports = router;