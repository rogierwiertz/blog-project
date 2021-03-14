const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const upload = require('../middleware/uploads');
const dummyProtect = require('../middleware/dummy-protect');

// Routes for /profile
router.get('/my-profile', authenticate, profileController.getMyProfile);
router.post('/update-profile', authenticate, dummyProtect(null, '/profile/my-profile?edit=false'), validate.updateProfileForm, profileController.postUpdateProfile);
router.get('/delete-account', authenticate, profileController.getDeleteAccount);
router.post('/delete-account', authenticate, dummyProtect(null, '/profile/delete-account'), validate.deleteAccountForm, profileController.postDeleteAccount);
router.post('/upload-image', authenticate, dummyProtect(null, '/profile/my-profile'), upload.single('image'), profileController.postUploadImage);
router.post('/delete-image', authenticate, dummyProtect(null, '/profile/my-profile'), profileController.postDeleteImage);
router.get('/change-password', authenticate, profileController.getChangePassword);
router.post('/change-password', authenticate, dummyProtect(null, '/profile/change-password'),  validate.changePassword, profileController.postChangePassword);
module.exports = router;