// ไฟล์: front_end/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // 1. ดึงไอคอนรูปตาเข้ามา
import './LoginPage.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // 2. สร้าง State สำหรับเปิด/ปิดรหัสผ่าน (เริ่มต้นเป็น false คือปิดไว้)
  const [showPassword, setShowPassword] = useState(false);

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
        sessionStorage.setItem('user', JSON.stringify(data.user));
        alert(`ยินดีต้อนรับ ${data.user.name} (${data.user.role})`);
        
        if (data.user.role === 'Admin') {
          window.location.href = '/reports';
        } else {
          window.location.href = '/sales';
        }
      } else {
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
            {/* 3. เอา div มาครอบ input เพื่อให้จัดตำแหน่งไอคอนรูปตาได้ */}
            <div className="password-input-container">
              <input 
                type={showPassword ? "text" : "password"} /* สลับประเภท input ตาม State */
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="กรอกรหัสผ่าน"
              />
              {/* 4. ปุ่มสลับเปิด/ปิดตา */}
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