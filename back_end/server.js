const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// อนุญาตให้ Frontend (React) ส่งข้อมูลเข้ามาได้
app.use(cors());
app.use(express.json());

// นำเข้าไฟล์ Routes
const authRoutes = require('./src/routes/authRoutes');

// เปิดใช้งาน Routes
app.use('/api/auth', authRoutes);

// ตั้งค่า Port และรัน Server
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('✅ POS Backend is Running smoothly!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});