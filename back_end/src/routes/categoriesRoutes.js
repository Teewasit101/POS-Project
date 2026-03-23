const express = require('express');
const router = express.Router();
const pool = require('../../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY category_id ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงหมวดหมู่' });
  }
});

module.exports = router;