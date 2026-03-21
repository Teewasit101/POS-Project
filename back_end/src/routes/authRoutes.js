const express = require('express');
const router = express.Router();
const pool = require('../../db'); // ย้อนกลับไปเรียกไฟล์ db.js ที่อยู่หน้าสุด

// API สำหรับ Login: POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // ค้นหาพนักงานและ Role จาก Database
    const query = `
      SELECT e.employee_id, e.username, e.password, e.name, r.role_name 
      FROM employee e
      JOIN roles r ON e.role_id = r.role_id
      WHERE e.username = $1
    `;
    const result = await pool.query(query, [username]);

    // ถ้าไม่เจอ Username ในระบบ
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'ไม่พบชื่อผู้ใช้งานนี้ในระบบ' });
    }

    const user = result.rows[0];

    // ตรวจสอบรหัสผ่าน
    if (password !== user.password) {
      return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // ล็อกอินสำเร็จ ส่งข้อมูลกลับไปให้หน้าเว็บ
    res.status(200).json({
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        employee_id: user.employee_id,
        username: user.username,
        name: user.name,
        role: user.role_name
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

module.exports = router;