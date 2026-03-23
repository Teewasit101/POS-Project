// ไฟล์: src/routes/rolesRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../../db'); 

// 1. READ: ดึงข้อมูลตำแหน่งทั้งหมด
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles ORDER BY role_id ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่ง' });
  }
});

// 2. CREATE: เพิ่มตำแหน่งใหม่
router.post('/', async (req, res) => {
  const { role_id, role_name } = req.body;
  try {
    const query = `INSERT INTO roles (role_id, role_name) VALUES ($1, $2) RETURNING *`;
    await pool.query(query, [role_id, role_name]);
    res.status(201).json({ message: 'เพิ่มตำแหน่งสำเร็จ' });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'รหัสตำแหน่ง หรือ ชื่อตำแหน่ง นี้มีในระบบแล้ว' });
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล' });
  }
});

// 3. UPDATE: แก้ไขตำแหน่ง
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { role_name } = req.body;
  try {
    const query = `UPDATE roles SET role_name=$1 WHERE role_id=$2`;
    await pool.query(query, [role_name, id]);
    res.status(200).json({ message: 'อัปเดตข้อมูลสำเร็จ' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' });
  }
});

// 4. DELETE: ลบตำแหน่ง
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM roles WHERE role_id = $1', [id]);
    res.status(200).json({ message: 'ลบข้อมูลสำเร็จ' });
  } catch (error) {
    console.error(error);
    //  ดัก Error รหัส 23503: ไม่ให้ลบถ้าตำแหน่งนี้ยังมีพนักงานใช้อยู่ (Foreign Key Violation)
    if (error.code === '23503') {
      return res.status(400).json({ message: 'ไม่สามารถลบได้ เนื่องจากยังมีพนักงานที่ใช้ตำแหน่งนี้อยู่!' });
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
  }
});

module.exports = router;