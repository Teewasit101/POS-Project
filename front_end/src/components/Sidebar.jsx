// ไฟล์: front_end/src/components/Sidebar.jsx
import React from "react";
import "./Sidebar.css";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaCashRegister,
  FaBoxOpen,
  FaWarehouse,
  FaUsers,
  FaChartBar,
  FaSignOutAlt,
} from "react-icons/fa";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    Swal.fire({
      title: 'ยืนยันการออกจากระบบ?',
      text: "คุณต้องการออกจากระบบใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "/login";
      }
    });
  };

  // ดึงข้อมูลผู้ใช้งานที่ล็อกอินอยู่ ดึง role_id
  const user = JSON.parse(sessionStorage.getItem("user"));
  const userRoleId = user?.role_id || 0;

  // 1. สร้างรายการเมนูทั้งหมด และกำหนดว่า Role ไหนเห็นได้บ้าง
  const allMenuItems = [
    { path: "/pos", label: "POS", icon: <FaCashRegister />, allowedRoleIds: [1, 2] }, 
    //{ path: "/sales", label: "หน้าขาย", icon: <FaCashRegister />, allowedRoleIds: [1, 2] }, 
    { path: "/products", label: "สินค้า", icon: <FaBoxOpen />, allowedRoleIds: [1, 2] }, 
    { path: "/stocks", label: "สต็อก", icon: <FaWarehouse />, allowedRoleIds: [1, 2] }, 
    { path: "/employees", label: "พนักงาน", icon: <FaUsers />, allowedRoleIds: [1] }, 
    { path: "/roles", label: "สิทธิ์", icon: <FaUsers />, allowedRoleIds: [1] },
    { path: "/reports", label: "รายงาน", icon: <FaChartBar />, allowedRoleIds: [1] }, 
    
    
  ];

  // 3. กรองเมนูโดยเช็คว่า role_id ของคนที่ล็อกอิน ตรงกับ allowedRoleIds ไหม
  const authorizedMenus = allMenuItems.filter(item => item.allowedRoleIds.includes(userRoleId));

  return (
    <nav className="sidebar">
      <ul className="side-links">
        {/* 3. นำเมนูที่กรองแล้ว (authorizedMenus) มาวนลูปแสดงผล */}
        {authorizedMenus.map((item) => (
          <li
            key={item.path}
            className={location.pathname === item.path ? "active" : ""}
          >
            <Link to={item.path}>
              {item.icon} {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="account-section">
        <div className="account">
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
            {user?.name || "Guest"}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>
            @{user?.username || "unknown"} | {user?.role || "ไม่ระบุตำแหน่ง"}
          </div>
        </div>

        <div className="logout" onClick={handleLogoutClick}>
          <FaSignOutAlt /> Logout
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;