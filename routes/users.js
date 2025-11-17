// routes/users.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const User = require('../models/User');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // IMPORTANT

const uploadToCloudinary = require('../utils/uploadToCloudinary');

const {
  ensureAuthenticated,
  forwardAuthenticated
} = authController;

// Register
router.get('/register', forwardAuthenticated, authController.getRegister);
router.post('/register', authController.postRegister);

// Login
router.get('/login', forwardAuthenticated, authController.getLogin);
router.post('/login', authController.postLogin);

// Logout
router.post('/logout', authController.logout);

// Profile
router.get('/profile', ensureAuthenticated, async (req, res) => {
  res.render('users/profile', { user: req.user });
});

// Upload Gov ID + Driving License (Cloudinary)
router.post(
  '/upload-docs',
  ensureAuthenticated,
  upload.fields([
    { name: 'govIdFile', maxCount: 1 },
    { name: 'drivingLicenseFile', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);

      // Upload Gov ID
      if (req.files.govIdFile) {
        const govIdUrl = await uploadToCloudinary(
          req.files.govIdFile[0].buffer,
          "users/govId"
        );
        user.govIdFile = govIdUrl;
      }

      // Upload DL
      if (req.files.drivingLicenseFile) {
        const dlUrl = await uploadToCloudinary(
          req.files.drivingLicenseFile[0].buffer,
          "users/drivingLicense"
        );
        user.drivingLicenseFile = dlUrl;
      }

      await user.save();

      req.flash('success_msg', 'Documents uploaded successfully!');
      res.redirect('/users/profile');

    } catch (err) {
      console.error("USER DOC UPLOAD ERROR:", err);
      req.flash('error_msg', 'Upload failed');
      res.redirect('/users/profile');
    }
  }
);

module.exports = router;
