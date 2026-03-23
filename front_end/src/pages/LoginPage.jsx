// ไฟล์: front_end/src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './LoginPage.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 1. ดักจับคนที่ล็อกอินอยู่แล้ว ไม่ให้เข้าหน้า Login ซ้ำ
  useEffect(() => {
    const loggedInUser = sessionStorage.getItem('user');
    if (loggedInUser) {
      const user = JSON.parse(loggedInUser);
      // ถ้าเป็น Admin ให้กลับไปหน้า reports ถ้าเป็น Cashier ให้ไปหน้า sales
      if (user.role === 'Admin') {
        window.location.replace('/sales');
      } else {
        window.location.replace('/sales');
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        // บันทึกข้อมูลลง Session
        sessionStorage.setItem('user', JSON.stringify(data.user));
        
        // แจ้งเตือนความสำเร็จ
        Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ!',
          text: `ยินดีต้อนรับ ${data.user.name} (${data.user.role})`,
          showConfirmButton: false,
          timer: 1500 
        }).then(() => {
          // 2. ใช้ replace เพื่อเปลี่ยนหน้า และลบหน้า Login ออกจากประวัติการกด Back
          if (data.user.role === 'Admin') {
            window.location.replace('/sales');
          } else {
            window.location.replace('/sales');
          }
        });

      } else {
        // รหัสผ่านผิด หรือไม่พบผู้ใช้
        setErrorMsg(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMsg('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">ระบบจัดการร้าน POS Cafe</h2>
        
        {errorMsg && (
          <div className="error-message">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">ชื่อผู้ใช้งาน</label>
            <input 
              type="text" 
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="กรอกชื่อผู้ใช้งาน"
            />
          </div>

          <div className="form-group last">
            <label className="form-label">รหัสผ่าน</label>
            <div className="password-input-container">
              <input 
                type={showPassword ? "text" : "password"}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="กรอกรหัสผ่าน"
              />
              <span 
                className="password-toggle-icon" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button type="submit" className="submit-button">
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;