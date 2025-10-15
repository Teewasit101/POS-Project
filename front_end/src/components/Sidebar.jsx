import "./Sidebar.css";
import { useNavigate, Link } from "react-router-dom"; // ใช้ Link แทน <a>
import {
  FaCashRegister,
  FaBoxOpen,
  FaWarehouse,
  FaUsers,
  FaChartBar,
  FaSignOutAlt
} from "react-icons/fa";

function Sidebar() {
  // สำหรับเปลี่ยนหน้าแบบโปรแกรม (logout)
  const navigate = useNavigate();

  // ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/"); // กลับไปหน้า login
  };

  // ดึงข้อมูลผู้ใช้จาก localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const userid = user?.id || {};
  const permission = user?.permission || {};

  return (
    <nav className="sidebar">
      <ul className="side-links">

        {/* เมนูหลักของ POS */}
        <li>
          <Link to="/sales"><FaCashRegister /> หน้าขาย</Link>
        </li>
        <li>
          <Link to="/products"><FaBoxOpen /> สินค้า</Link>
        </li>
        <li>
          <Link to="/stocks"><FaWarehouse /> สต็อก</Link>
        </li>
        <li>
          <Link to="/employees"><FaUsers /> พนักงาน</Link>
        </li>
        <li>
          <Link to="/reports"><FaChartBar /> รายงาน</Link>
        </li>

      </ul>

      {/* ส่วนแสดงชื่อผู้ใช้ */}
      <div className="account-section">
        <div className="account">
          Account <br />
          {user?.name || "Guest"}
        </div>
        <div className="logout" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;
