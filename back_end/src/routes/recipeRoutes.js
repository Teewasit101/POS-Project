const express = require('express');
const router = express.Router();
const pool = require('../../db');

// 1. ดึงข้อมูลสูตรชงทั้งหมดของสินค้านั้นๆ
router.get('/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const query = `
      SELECT 
        pr.recipe_id,
        pr.product_id,
        pr.ingredient_id,
        i.ingredient_name,
        i.unit,
        pr.quantity -- 🌟 ใช้ชื่อคอลัมน์ quantity ตาม Database ของคุณ
      FROM product_recipe pr
      JOIN ingredients i ON pr.ingredient_id = i.ingredient_id
      WHERE pr.product_id = $1
      ORDER BY i.ingredient_name ASC
    `;
    const result = await pool.query(query, [productId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลสูตรชงได้' });
  }
});

// 2. เพิ่มส่วนผสมเข้าไปในสูตรชง
router.post('/:productId', async (req, res) => {
  const { productId } = req.params;
  // 🌟 รับค่า quantity จากหน้าเว็บ
  const { ingredient_id, quantity } = req.body; 
  try {
    await pool.query(
      'INSERT INTO product_recipe (product_id, ingredient_id, quantity) VALUES ($1, $2, $3)',
      [productId, ingredient_id, quantity]
    );
    res.status(201).json({ message: 'เพิ่มส่วนผสมลงในสูตรสำเร็จ!' });
  } catch (error) {
    console.error('Error adding recipe item:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกสูตร' });
  }
});

// 3. ลบส่วนผสมออกจากสูตรชง
router.delete('/:recipeId', async (req, res) => {
  const { recipeId } = req.params;
  try {
    await pool.query('DELETE FROM product_recipe WHERE recipe_id = $1', [recipeId]);
    res.status(200).json({ message: 'ลบส่วนผสมออกจากสูตรเรียบร้อย' });
  } catch (error) {
    console.error('Error deleting recipe item:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบส่วนผสม' });
  }
});

module.exports = router;