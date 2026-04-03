// routes/devices.js
const express = require('express');
const router  = express.Router();

const {
  getDevices,
  getDevice,
  addDevice,
  toggleDevice,
  deleteDevice,
  getDeviceLogs,
} = require('../controllers/deviceController');

const { protect }                          = require('../middleware/auth');
const { addDeviceRules, handleValidation } = require('../middleware/validate');

// All device routes require authentication
router.use(protect);

router.get('/',              getDevices);
router.get('/:id',           getDevice);
router.post('/', addDeviceRules, handleValidation, addDevice);
router.patch('/:id/toggle',  toggleDevice);
router.delete('/:id',        deleteDevice);
router.get('/:id/logs',      getDeviceLogs);

module.exports = router;