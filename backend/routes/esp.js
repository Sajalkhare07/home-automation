// routes/esp.js
// Lightweight endpoints designed for microcontrollers
const express = require('express');
const router  = express.Router();
const { query } = require('../config/db');

// GET /api/esp/status?user_id=1
// Returns all device pin states for a user — no JWT needed for hardware
router.get('/status', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id required' });
    }

    const devices = await query(
      'SELECT id, name, pin, status FROM devices WHERE user_id = ?',
      [user_id]
    );

    // Return compact format ESP8266 can parse easily
    res.json({
      success: true,
      devices: devices.map(d => ({
        id:     d.id,
        name:   d.name,
        pin:    d.pin,
        state:  d.status === 'on' ? 1 : 0,  // 1=ON, 0=OFF
      })),
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/esp/update — ESP reports a pin state change (e.g. physical button press)
router.post('/update', async (req, res) => {
  try {
    const { device_id, action, user_id } = req.body;

    if (!device_id || !action || !user_id) {
      return res.status(400).json({ success: false, message: 'device_id, action, user_id required' });
    }

    if (!['on', 'off'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be on or off' });
    }

    await query('UPDATE devices SET status = ? WHERE id = ?', [action, device_id]);
    await query(
      `INSERT INTO device_logs (device_id, user_id, action, triggered_by)
       VALUES (?, ?, ?, 'manual')`,
      [device_id, user_id, action]
    );

    res.json({ success: true, message: `Device ${device_id} set to ${action}` });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;