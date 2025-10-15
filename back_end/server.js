// server/server.js
import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ตัวอย่าง API
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express Server 🚀" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
