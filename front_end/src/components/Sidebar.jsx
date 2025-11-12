import "./Sidebar.css";
import { useNavigate, Link, useLocation } from "react-router-dom"; // เพิ่ม useLocation เพื่อตรวจสอบ path ปัจจุบัน
import {
  FaCashRegister, // หน้าขาย
  FaBoxOpen, // สินค้า
  FaWarehouse, // สต็อก
  FaUsers, // พนักงาน
  FaChartBar, // รายงาน
  FaSignOutAlt, // ออกจากระบบ
} from "react-icons/fa";

function Sidebar() {
  // สำหรับเปลี่ยนหน้าแบบโปรแกรม (logout)
  const navigate = useNavigate();
  const location = useLocation(); // ตรวจสอบหน้า route ปัจจุบัน

  // ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    localStorage.removeItem("token"); // ลบ token
    localStorage.removeItem("user"); // ลบข้อมูลผู้ใช้
    navigate("/"); // กลับไปหน้า login
  };

  // ดึงข้อมูลผู้ใช้จาก localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const userid = user?.id || {}; // ดึงรหัสผู้ใช้ ป้องกัน null/undefined
  const permission = user?.permission || {}; // ดึงสิทธิ์การใช้งาน

  // กำหนดเมนูหลัก
  const menuItems = [
    { path: "/login/sales", label: "หน้าขาย", icon: <FaCashRegister /> },
    { path: "/login/products", label: "สินค้า", icon: <FaBoxOpen /> },
    { path: "/login/stocks", label: "สต็อก", icon: <FaWarehouse /> },
    { path: "/login/employees", label: "พนักงาน", icon: <FaUsers /> },
    { path: "/login/reports", label: "รายงาน", icon: <FaChartBar /> },
  ];

  return (
    <nav className="sidebar">
      <ul className="side-links">
        {/* วนลูปสร้างเมนู Sidebar */}
        {menuItems.map((item) => (
          <li
            key={item.path}
            className={location.pathname === item.path ? "active" : ""} // ถ้า path ตรงกับหน้า ปรับสี active
          >
            <Link to={item.path}>
              {item.icon} {item.label} {/* แสดงไอคอน + ชื่อเมนู */}
            </Link>
          </li>
        ))}
      </ul>

      {/* ส่วนแสดงชื่อผู้ใช้ */}
      <div className="account-section">
        <div className="account">
          Account <br />
          {user?.name || "Guest"} {/* แสดงชื่อผู้ใช้ หรือ Guest */}
        </div>

        {/* ปุ่ม Logout */}
        <div className="logout" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;
