const express = require('express');
const router = express.Router();
const pool = require('../../db');

// 1. ดึงข้อมูลสินค้าทั้งหมด (พร้อมชื่อหมวดหมู่)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT p.product_id, p.product_name, p.price, p.category_id, 
             c.category_name, p.image_url, p.is_available 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      ORDER BY p.product_id ASC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' });
  }
});

// 2. เพิ่มสินค้าใหม่
router.post('/', async (req, res) => {
  const { product_id, product_name, price, category_id, image_url, is_available } = req.body;
  try {
    const query = `
      INSERT INTO products (product_id, product_name, price, category_id, image_url, is_available) 
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await pool.query(query, [
      product_id, 
      product_name, 
      price, 
      category_id, 
      image_url || null, 
      is_available !== undefined ? is_available : true
    ]);
    res.status(201).json({ message: 'เพิ่มสินค้าสำเร็จ' });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'รหัสสินค้านี้มีในระบบแล้ว!' });
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มสินค้า' });
  }
});

// 3. แก้ไขข้อมูลสินค้า
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { product_name, price, category_id, image_url, is_available } = req.body;
  try {
    const query = `
      UPDATE products 
      SET product_name=$1, price=$2, category_id=$3, image_url=$4, is_available=$5 
      WHERE product_id=$6
    `;
    await pool.query(query, [product_name, price, category_id, image_url, is_available, id]);
    res.status(200).json({ message: 'แก้ไขสินค้าสำเร็จ' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขสินค้า' });
  }
});

// 4. ลบสินค้า
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE product_id = $1', [id]);
    res.status(200).json({ message: 'ลบสินค้าสำเร็จ' });
  } catch (error) {
    console.error(error);
    if (error.code === '23503') {
      return res.status(400).json({ message: 'ไม่สามารถลบได้ เนื่องจากสินค้านี้ผูกกับสูตรหรือออเดอร์อยู่!' });
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบสินค้า' });
  }
});

module.exports = router;