const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// อนุญาตให้ Frontend (React) ส่งข้อมูลเข้ามาได้
app.use(cors());
app.use(express.json());

// 1. นำเข้า multer และ path (เพิ่มไว้บนๆ ของไฟล์)
const multer = require('multer');
const path = require('path');

// 2. ตั้งค่าการอัปโหลดไฟล์ (เอาไปวางไว้ก่อนส่วนของ Routes)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // เก็บไฟล์ไว้ที่โฟลเดอร์ uploads/
  },
  filename: function (req, file, cb) {
    //ตั้งชื่อไฟล์ใหม่ไม่ให้ซ้ำกัน (ใช้เวลาปัจจุบัน + นามสกุลไฟล์เดิม)
    cb(null, Date.now() + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// 3. อนุญาตให้ Frontend เข้าถึงโฟลเดอร์รูปภาพได้
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. สร้าง API สำหรับรับไฟล์อัปโหลด
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'ไม่มีไฟล์ถูกอัปโหลด' });
  }
  // ส่ง URL ของรูปภาพกลับไปให้ Frontend
  const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.status(200).json({ imageUrl: imageUrl });
});



// นำเข้าไฟล์ Routes
const authRoutes = require('./src/routes/authRoutes');
const employeesRoutes = require('./src/routes/employeesRoutes');
const rolesRoutes = require('./src/routes/rolesRoutes');
const productsRoutes = require('./src/routes/productsRoutes');
const categoriesRoutes = require('./src/routes/categoriesRoutes');
const stockRoutes = require('./src/routes/stockRoutes');
const salesRoutes = require('./src/routes/salesRoutes');
const recipeRoutes = require('./src/routes/recipeRoutes');

// เปิดใช้งาน Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/recipes', recipeRoutes);

// ตั้งค่า Port และรัน Server
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('✅ POS Backend is Running smoothly!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});