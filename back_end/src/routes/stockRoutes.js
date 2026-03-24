const express = require('express');
const router = express.Router();
const pool = require('../../db');

// 1. ดึงข้อมูลสต็อกทั้งหมด (รวมเช็ควันหมดอายุ)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        i.ingredient_id, 
        i.ingredient_name, 
        i.unit, 
        i.min_quantity,
        COALESCE(SUM(inv.quantity), 0) AS total_quantity,
        MAX(inv.purchase_date) AS last_update_date,
        -- เช็คว่า มีล็อตที่วันหมดอายุน้อยกว่าวันนี้ ค้างอยู่ไหม?
        EXISTS (
          SELECT 1 FROM inventory sub_inv 
          WHERE sub_inv.ingredient_id = i.ingredient_id 
          AND sub_inv.expiration_date < CURRENT_DATE 
          AND sub_inv.quantity > 0
        ) AS has_expired_lot
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

// 2. เพิ่มวัตถุดิบใหม่ (ป้องกันชื่อซ้ำ + ไม่สนตัวเล็กตัวใหญ่ + รองรับวันหมดอายุล็อตแรก)
router.post('/', async (req, res) => {
  const { ingredient_id, ingredient_name, unit, min_quantity, total_quantity, expiration_date } = req.body;
  try {
    const checkDuplicate = await pool.query(
      'SELECT * FROM ingredients WHERE LOWER(ingredient_name) = LOWER($1)',
      [ingredient_name]
    );

    if (checkDuplicate.rows.length > 0) {
      return res.status(400).json({ message: 'ชื่อวัตถุดิบนี้มีอยู่ในระบบแล้ว!' });
    }

    await pool.query('BEGIN'); 

    // บันทึกข้อมูลหลัก
    await pool.query(
      'INSERT INTO ingredients (ingredient_id, ingredient_name, unit, min_quantity) VALUES ($1, $2, $3, $4)',
      [ingredient_id, ingredient_name, unit, min_quantity]
    );

    // ถ้ายอดที่กรอกมามากกว่า 0 ให้บันทึกลง inventory ด้วย
    if (total_quantity > 0) {
      await pool.query(
        'INSERT INTO inventory (ingredient_id, quantity, purchase_date, expiration_date) VALUES ($1, $2, (CURRENT_TIMESTAMP AT TIME ZONE \'Asia/Bangkok\')::DATE, $3)',
        [ingredient_id, total_quantity, expiration_date || null] 
      );
    }

    await pool.query('COMMIT');
    res.status(201).json({ message: 'Added successfully' });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    if (error.code === '23505') return res.status(400).json({ message: 'ชื่อวัตถุดิบนี้มีอยู่ในระบบแล้ว!' });
    res.status(500).json({ message: 'Error adding ingredient' });
  }
});

// 3. แก้ไขข้อมูลวัตถุดิบ
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

// ==========================================
//  ส่วนของระบบ Lot Tracking ที่หายไป กลับมาแล้ว!
// ==========================================

// 5. ดึงข้อมูลล็อตสินค้าทั้งหมดของวัตถุดิบนั้นๆ (View Lots)
router.get('/:id/lots', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT inventory_id, quantity, purchase_date, expiration_date 
       FROM inventory 
       WHERE ingredient_id = $1 AND quantity > 0
       ORDER BY expiration_date ASC NULLS LAST, purchase_date ASC`,
      [req.params.id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching lots' });
  }
});

// 6. รับของเข้าสต็อก (Stock In)
router.post('/:id/receive', async (req, res) => {
  const { id } = req.params;
  const { quantity, purchase_date, expiration_date } = req.body;
  try {
    await pool.query(
      'INSERT INTO inventory (ingredient_id, quantity, purchase_date, expiration_date) VALUES ($1, $2, $3, $4)',
      [id, quantity, purchase_date, expiration_date || null] 
    );
    res.status(201).json({ message: 'Stock received successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error receiving stock' });
  }
});

// 7. ลบล็อตสินค้า (เคลียร์ของเสีย/หมดอายุ)
router.delete('/lot/:inventoryId', async (req, res) => {
  try {
    await pool.query('DELETE FROM inventory WHERE inventory_id = $1', [req.params.inventoryId]);
    res.status(200).json({ message: 'เคลียร์สต็อกล็อตนี้เรียบร้อย' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error clearing lot' });
  }
});

module.exports = router;