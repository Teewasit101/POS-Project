// server/server.js
import express from "express";
import cors from "cors";
import oracle from "oracledb";

const app = express();
const PORT = 5000;
app.use(express.json());
app.use(cors());

// ========================Oracle Client Init===========================
const clientLib =
  process.platform === "win32"
    ? "C:\\oracle\\instantclient_23_9"
    : "/opt/oracle/instantclient_23_26";
oracle.initOracleClient({ libDir: clientLib });
// ========================Oracle DB config===========================
const dbConfig = {
  user: "DBT68088",
  password: "32626",
  connectString: `(DESCRIPTION=
    (ADDRESS=(PROTOCOL=TCP)(HOST=203.188.54.7)(PORT=1521))
    (CONNECT_DATA=(SID=Database3))
  )`,
};

async function testConnection() {
  let connection;
  try {
    connection = await oracle.getConnection(dbConfig);
    console.log("✅ Oracle DB connected successfully!");
  } catch (err) {
    console.error("❌ Oracle DB connection failed: ", err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

// ทดสอบการเชื่อมต่อฐานข้อมูลเมื่อเริ่มเซิร์ฟเวอร์
testConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
// Start the server
