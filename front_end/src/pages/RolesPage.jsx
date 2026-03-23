// ไฟล์: front_end/src/pages/RolesPage.jsx
import React, { useState, useEffect } from 'react';
import './RolesPage.css'; //  
import { FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';

function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    role_id: '',
    role_name: ''
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ฟังก์ชัน Auto ID สำหรับตำแหน่ง
  const generateNextRoleId = () => {
    if (roles.length === 0) return 1;
    const maxId = Math.max(...roles.map(r => parseInt(r.role_id, 10)));
    return maxId + 1;
  };

  const handleAddClick = () => {
    setIsEditing(false);
    setFormData({ role_id: generateNextRoleId(), role_name: '' });
    setShowModal(true);
  };

  const handleEditClick = (role) => {
    setIsEditing(true);
    setFormData({
      role_id: role.role_id,
      role_name: role.role_name
    });
    setShowModal(true);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    const url = isEditing 
      ? `http://localhost:5000/api/roles/${formData.role_id}` 
      : 'http://localhost:5000/api/roles';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        Swal.fire({ icon: 'success', title: isEditing ? 'แก้ไขสำเร็จ!' : 'เพิ่มตำแหน่งสำเร็จ!', showConfirmButton: false, timer: 1500 });
        setShowModal(false);
        fetchRoles(); 
      } else {
        const result = await response.json();
        Swal.fire('ผิดพลาด', result.message, 'error');
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
    }
  };

  const handleDelete = (id, roleName) => {
    Swal.fire({
      title: 'ยืนยันการลบ?', text: `คุณต้องการลบตำแหน่ง "${roleName}" ใช่หรือไม่?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#e74c3c', cancelButtonColor: '#9ca3af', confirmButtonText: 'ยืนยันการลบ'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:5000/api/roles/${id}`, { method: 'DELETE' });
          if (response.ok) {
            Swal.fire('ลบสำเร็จ!', 'ตำแหน่งถูกลบแล้ว', 'success');
            fetchRoles(); 
          } else {
            const resData = await response.json();
            Swal.fire('ไม่สามารถลบได้!', resData.message, 'error');
          }
        } catch (error) {
          Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
        }
      }
    });
  };

  //  ฟังก์ชันดึง Class Badge ของตำแหน่ง
  const getBadgeClass = (id) => {
    if (id === 1) return 'roles-role-admin';
    if (id === 2) return 'roles-role-cashier';
    return 'roles-role-other';
  };

  return (
    <div className="roles-page-container">
      <div className="roles-header">
        <h2>จัดการสิทธิ์/ตำแหน่ง</h2>
        {/*  ปุ่ม "เพิ่มตำแหน่ง" สไตล์สี Cyan เหมือนของพนักงาน */}
        <button className="btn-add-role" onClick={handleAddClick}>
          <FaPlus /> เพิ่มตำแหน่ง
        </button>
      </div>

      <div className="roles-table-container">
        {/*  ตารางกว้างเต็ม 100% */}
        <table className="roles-table"> 
          <thead>
            <tr>
              {/*  กำหนดความกว้างคอลัมน์ให้พอดีกัน */}
              <th style={{ width: '25%' }}>รหัสตำแหน่ง (ID)</th>
              <th style={{ width: '25%' }}>ชื่อตำแหน่ง (Role Name)</th>
              <th style={{ width: '6%', textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {roles.length > 0 ? (
              roles.map((role) => (
                <tr key={role.role_id}>
                  <td style={{ fontWeight: 'bold' }}>{role.role_id}</td>
                  <td>
                    {/* Badge สีตามตำแหน่ง เหมือนในรูปตัวอย่าง image_0.png */}
                    <span className={`roles-role-badge ${getBadgeClass(role.role_id)}`}>
                      {role.role_name}
                    </span>
                  </td>
                  <td className="roles-action-buttons">
                    <button className="role-btn-edit" onClick={() => handleEditClick(role)} title="แก้ไข"><FaEdit /></button>
                    <button className="role-btn-delete" onClick={() => handleDelete(role.role_id, role.role_name)} title="ลบ"><FaTrash /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: '#adb5bd', padding: '40px' }}>ไม่พบข้อมูลตำแหน่ง</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal หน้าต่าง Pop-up สไตล์เหมือนเดิมเป๊ะๆ */}
      {showModal && (
        <div className="roles-modal-overlay">
          <div className="roles-modal-box">
            <div className="roles-modal-header">
              <h3>{isEditing ? 'แก้ไขตำแหน่ง' : 'เพิ่มตำแหน่งใหม่'}</h3>
              <button className="roles-close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            
            <form onSubmit={handleSaveRole}>
              <div className="roles-form-group">
                <label>รหัสตำแหน่ง (Auto ID)</label>
                <input type="text" value={formData.role_id} readOnly style={{ backgroundColor: '#f1f3f5', cursor: 'not-allowed', color: '#6c757d' }} />
              </div>

              <div className="roles-form-group" style={{ marginBottom: '25px' }}>
                <label>ชื่อตำแหน่ง</label>
                <input type="text" name="role_name" value={formData.role_name} onChange={handleInputChange} required placeholder="เช่น Manager, Supervisor" />
              </div>

              <div className="roles-modal-footer">
                <button type="button" className="roles-btn-cancel" onClick={() => setShowModal(false)}>ยกเลิก</button>
                <button type="submit" className="roles-btn-confirm">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RolesPage;