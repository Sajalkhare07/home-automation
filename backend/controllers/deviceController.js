// controllers/deviceController.js
const { query } = require('../config/db');

// ─── GET /api/devices ──────────────────────────────────────
// Get all devices for the logged-in user
exports.getDevices = async (req, res, next) => {
  try {
    const devices = await query(
      `SELECT id, name, type, location, status, pin, created_at
       FROM devices
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, count: devices.length, devices });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/devices/:id ──────────────────────────────────
// Get single device
exports.getDevice = async (req, res, next) => {
  try {
    const devices = await query(
      `SELECT id, name, type, location, status, pin, created_at
       FROM devices
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (devices.length === 0) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    res.json({ success: true, device: devices[0] });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/devices ─────────────────────────────────────
// Add a new device
exports.addDevice = async (req, res, next) => {
  try {
    const { name, type, location, pin } = req.body;

    // Check pin not already used by this user
    const existing = await query(
      'SELECT id FROM devices WHERE pin = ? AND user_id = ?',
      [pin, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Pin ${pin} is already assigned to another device`,
      });
    }

    const result = await query(
      `INSERT INTO devices (name, type, location, pin, user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [name, type || 'other', location || 'Home', pin, req.user.id]
    );

    const newDevice = await query(
      'SELECT * FROM devices WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ success: true, device: newDevice[0] });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/devices/:id/toggle ────────────────────────
// Turn device ON or OFF + log the action
exports.toggleDevice = async (req, res, next) => {
  try {
    const { action } = req.body; // 'on' or 'off'

    if (!['on', 'off'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be 'on' or 'off'",
      });
    }

    // Verify device belongs to user
    const devices = await query(
      'SELECT * FROM devices WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (devices.length === 0) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    // Update device status
    await query(
      'UPDATE devices SET status = ? WHERE id = ?',
      [action, req.params.id]
    );

    // Log the action
    await query(
      `INSERT INTO device_logs (device_id, user_id, action, triggered_by)
       VALUES (?, ?, ?, 'manual')`,
      [req.params.id, req.user.id, action]
    );

    // Return updated device
    const updated = await query(
      'SELECT id, name, type, location, status, pin FROM devices WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: `Device turned ${action.toUpperCase()}`,
      device: updated[0],
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/devices/:id ───────────────────────────────
// Remove a device
exports.deleteDevice = async (req, res, next) => {
  try {
    const devices = await query(
      'SELECT id FROM devices WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (devices.length === 0) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    await query('DELETE FROM devices WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'Device deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/devices/:id/logs ─────────────────────────────
// Get activity logs for a device
exports.getDeviceLogs = async (req, res, next) => {
  try {
    const devices = await query(
      'SELECT id FROM devices WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (devices.length === 0) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    const logs = await query(
      `SELECT dl.id, dl.action, dl.triggered_by, dl.created_at,
              u.name AS triggered_by_user
       FROM device_logs dl
       JOIN users u ON dl.user_id = u.id
       WHERE dl.device_id = ?
       ORDER BY dl.created_at DESC
       LIMIT 50`,
      [req.params.id]
    );

    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    next(err);
  }
};