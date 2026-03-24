const express = require('express');
const router = express.Router();
const pool = require('../../db');


// API สำหรับชำระเงินและบันทึกออเดอร์
router.post('/', async (req, res) => {
  //  1. เพิ่ม employee_id เข้ามารับค่าจากหน้าเว็บ
  const { cart, total_amount, employee_id } = req.body; 

  try {
    await pool.query('BEGIN');

    //  2. เพิ่ม employee_id เข้าไปในคำสั่ง INSERT ของตาราง orders
    const orderResult = await pool.query(
      'INSERT INTO orders (total_amount, employee_id) VALUES ($1, $2) RETURNING order_id',
      [total_amount, employee_id || null] // ถ้าหน้าเว็บไม่ได้ส่งมา ให้เป็น null ไปก่อน
    );
    const newOrderId = orderResult.rows[0].order_id;

    for (let item of cart) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [newOrderId, item.product_id, item.qty, item.price]
      );
    }

    await pool.query('COMMIT');
    res.status(201).json({ message: 'ชำระเงินสำเร็จ!', order_id: newOrderId });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Checkout Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกการขาย' });
  }
});

module.exports = router;