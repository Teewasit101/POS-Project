const express = require('express');
const router = express.Router();
const pool = require('../../db');

router.post('/', async (req, res) => {
  //  รับค่า payment_method, amount_received, change_amount เพิ่มเข้ามา
  const { cart, total_amount, employee_id, payment_method, amount_received, change_amount } = req.body; 

  try {
    await pool.query('BEGIN');

    //  บันทึกหัวบิล พร้อมข้อมูลการชำระเงิน และดึงเวลาที่สร้างบิลกลับมาทำใบเสร็จ
    //  1. เอา created_at ออกจาก RETURNING เพื่อไม่ให้ Database แจ้ง Error
    const orderResult = await pool.query(
      `INSERT INTO orders (total_amount, employee_id, payment_method, amount_received, change_amount) 
       VALUES ($1, $2, $3, $4, $5) RETURNING order_id`,
      [total_amount, employee_id || null, payment_method, amount_received || total_amount, change_amount || 0] 
    );
    const newOrderId = orderResult.rows[0].order_id;
    
    //  2. ให้ Server (Node.js) สร้างเวลาปัจจุบันขึ้นมาเองเลย สำหรับเอาไปพิมพ์ใบเสร็จ
    const orderDate = new Date().toISOString();
    
    

    for (let item of cart) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [newOrderId, item.product_id, item.qty, item.price]
      );

      const recipeRes = await pool.query('SELECT ingredient_id, quantity FROM product_recipe WHERE product_id = $1', [item.product_id]);

      for (let recipe of recipeRes.rows) {
        let amountNeeded = recipe.quantity * item.qty; 
        const lotsRes = await pool.query(
          `SELECT inventory_id, quantity FROM inventory 
           WHERE ingredient_id = $1 AND quantity > 0 AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
           ORDER BY expiration_date ASC NULLS LAST, purchase_date ASC`,
          [recipe.ingredient_id]
        );

        for (let lot of lotsRes.rows) {
          if (amountNeeded <= 0) break; 
          if (lot.quantity >= amountNeeded) {
            await pool.query('UPDATE inventory SET quantity = quantity - $1 WHERE inventory_id = $2', [amountNeeded, lot.inventory_id]);
            amountNeeded = 0; 
          } else {
            await pool.query('UPDATE inventory SET quantity = 0 WHERE inventory_id = $1', [lot.inventory_id]);
            amountNeeded -= lot.quantity; 
          }
        }
        if (amountNeeded > 0) throw new Error(`วัตถุดิบไม่พอชง "${item.product_name}"`);
      }
    }

    await pool.query('COMMIT');
    // 🌟 ส่งข้อมูลออเดอร์กลับไปให้ Frontend ทำใบเสร็จ
    res.status(201).json({ 
      message: 'ชำระเงินสำเร็จ!', 
      order_id: newOrderId,
      created_at: orderDate
    });

  } catch (error) {
    await pool.query('ROLLBACK'); 
    console.error('Checkout Error:', error);
    if (error.message.includes('วัตถุดิบไม่พอชง')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกออเดอร์' });
  }
});

module.exports = router;