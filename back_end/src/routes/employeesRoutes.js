// ไฟล์: src/routes/employeesRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../../db');

// 1. READ: ดึงข้อมูลพนักงาน
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT e.employee_id, e.username, e.password, e.first_name, e.last_name, 
             e.role_id, r.role_name, e.phone, e.is_active 
      FROM employee e
      JOIN roles r ON e.role_id = r.role_id
      ORDER BY e.employee_id ASC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});

// 2. CREATE: เพิ่มพนักงาน
router.post('/', async (req, res) => {
  const { employee_id, username, password, first_name, last_name, role_id, phone, is_active } = req.body;
  try {
    const query = `
      INSERT INTO employee (employee_id, username, password, first_name, last_name, role_id, phone, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    await pool.query(query, [employee_id, username, password, first_name, last_name, role_id, phone, is_active]);
    res.status(201).json({ message: 'เพิ่มพนักงานสำเร็จ' });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ message: 'รหัสพนักงาน หรือ Username นี้มีแล้ว' });
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล' });
  }
});

// 3. UPDATE: แก้ไขพนักงาน
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password, first_name, last_name, role_id, phone, is_active } = req.body;
  try {
    if (password) {
      const query = `UPDATE employee SET username=$1, password=$2, first_name=$3, last_name=$4, role_id=$5, phone=$6, is_active=$7 WHERE employee_id=$8`;
      await pool.query(query, [username, password, first_name, last_name, role_id, phone, is_active, id]);
    } else {
      const query = `UPDATE employee SET username=$1, first_name=$2, last_name=$3, role_id=$4, phone=$5, is_active=$6 WHERE employee_id=$7`;
      await pool.query(query, [username, first_name, last_name, role_id, phone, is_active, id]);
    }
    res.status(200).json({ message: 'อัปเดตข้อมูลสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' });
  }
});

// 4. DELETE: ลบพนักงาน
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM employee WHERE employee_id = $1', [id]);
    res.status(200).json({ message: 'ลบข้อมูลสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
  }
});

module.exports = router;