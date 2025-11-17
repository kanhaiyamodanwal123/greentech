// routes/vehicles.js
const express = require('express');
const router = express.Router();

const vehicleController = require('../controllers/vehicleController');
const { ensureAuthenticated, ensureOwner, ensureRenter } = require('../controllers/authController');

// Multer (Memory Storage for Cloudinary)
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Fields for Cloudinary uploads
const vehicleUploads = upload.fields([
  { name: 'images', maxCount: 6 },
  { name: 'rcFile', maxCount: 1 },
  { name: 'insuranceFile', maxCount: 1 },
  { name: 'pollutionFile', maxCount: 1 }
]);

/* ----------------- OWNER ROUTES ----------------- */
router.get('/owner/dashboard', ensureAuthenticated, ensureOwner, vehicleController.ownerDashboard);

router.get('/add', ensureAuthenticated, ensureOwner, vehicleController.getAddVehicle);

router.post('/add', ensureAuthenticated, ensureOwner, vehicleUploads, vehicleController.postAddVehicle);

router.get('/edit/:id', ensureAuthenticated, ensureOwner, vehicleController.getEditVehicle);

router.post('/edit/:id', ensureAuthenticated, ensureOwner, vehicleUploads, vehicleController.postEditVehicle);

router.post('/delete/:id', ensureAuthenticated, ensureOwner, vehicleController.deleteVehicle);

/* ----------------- RENTER ROUTES ----------------- */
router.post('/:id/book', ensureAuthenticated, ensureRenter, vehicleController.bookVehicle);

/* ----------------- PUBLIC ROUTES ----------------- */
router.get('/', vehicleController.listVehicles);
router.get('/:id', vehicleController.getVehicleDetails);

module.exports = router;
