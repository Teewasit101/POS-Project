const express = require('express');
const router = express.Router();
const pool = require('../../db');
// 1. ดึงข้อมูลสต็อกทั้งหมด
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        i.ingredient_id, 
        i.ingredient_name, 
        i.unit, 
        i.min_quantity,
        COALESCE(SUM(inv.quantity), 0) AS total_quantity,
        MAX(inv.purchase_date) AS last_update_date -- ดึงวันที่รับของล่าสุดมาด้วย
      FROM ingredients i
      LEFT JOIN inventory inv ON i.ingredient_id = inv.ingredient_id
      GROUP BY i.ingredient_id, i.ingredient_name, i.unit, i.min_quantity
      ORDER BY i.ingredient_id ASC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching stock' });
  }
});

// 2. เพิ่มวัตถุดิบใหม่ (บันทึกลง ingredients และใส่ยอดยกมาใน inventory)
router.post('/', async (req, res) => {
  const { ingredient_id, ingredient_name, unit, min_quantity, total_quantity } = req.body;
  try {
    await pool.query('BEGIN'); // เริ่ม Transaction

    // 2.1 บันทึกข้อมูลหลัก
    await pool.query(
      'INSERT INTO ingredients (ingredient_id, ingredient_name, unit, min_quantity) VALUES ($1, $2, $3, $4)',
      [ingredient_id, ingredient_name, unit, min_quantity]
    );

    // 2.2 ถ้ายอดที่กรอกมามากกว่า 0 ให้บันทึกลง inventory ด้วย
    if (total_quantity > 0) {
      await pool.query(
        'INSERT INTO inventory (ingredient_id, quantity, purchase_date) VALUES ($1, $2, CURRENT_DATE)',
        [ingredient_id, total_quantity]
      );
    }

    await pool.query('COMMIT');
    res.status(201).json({ message: 'Added successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Error adding ingredient' });
  }
});

// 3. แก้ไขข้อมูลวัตถุดิบ (ยังไม่รวมการปรับสต็อกย้อนหลัง)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { ingredient_name, unit, min_quantity } = req.body;
  try {
    await pool.query(
      'UPDATE ingredients SET ingredient_name=$1, unit=$2, min_quantity=$3 WHERE ingredient_id=$4',
      [ingredient_name, unit, min_quantity, id]
    );
    res.status(200).json({ message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating ingredient' });
  }
});

// 4. ลบวัตถุดิบ
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('BEGIN');
    await pool.query('DELETE FROM inventory WHERE ingredient_id=$1', [id]); // ลบสต็อกก่อน
    await pool.query('DELETE FROM ingredients WHERE ingredient_id=$1', [id]); // ลบข้อมูลหลัก
    await pool.query('COMMIT');
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Error deleting ingredient' });
  }
});

module.exports = router;