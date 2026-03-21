// ไฟล์: back_end/db.js
const { Pool } = require('pg');
require('dotenv').config(); // โหลดค่า DATABASE_URL จากไฟล์ .env

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // จำเป็นต้องใช้เวลาต่อกับ Supabase
  }
});

// ส่วนนี้ใช้สำหรับทดสอบว่าเชื่อมต่อสำเร็จหรือไม่
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้:', err.message);
  } else {
    console.log('✅ เชื่อมต่อฐานข้อมูล POS Cafe สำเร็จเรียบร้อย!');
  }
  // คืนการเชื่อมต่อกลับสู่ระบบ
  if (client) release();
});

module.exports = pool;