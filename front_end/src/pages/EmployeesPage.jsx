// ไฟล์: front_end/src/pages/EmployeesPage.jsx
import React, { useState, useEffect } from 'react';
import './EmployeesPage.css';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaEye, FaEyeSlash, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Swal from 'sweetalert2';

function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ปรับหน้าที่แสดง
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [formData, setFormData] = useState({
    employee_id: '', username: '', password: '', first_name: '', last_name: '', role_id: 2, phone: '', is_active: true
  });

  useEffect(() => { 
    fetchEmployees(); 
  }, []);

  useEffect(() => { 
    setCurrentPage(1); 
  }, [searchTerm]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employees');
      if (response.ok) setEmployees(await response.json());
    } catch (error) { console.error('Error:', error); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // จัดการค่า Boolean ของสถานะ
    if (name === 'is_active') {
      setFormData({ ...formData, [name]: value === 'true' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // สร้างรหัสพนักงานอัตโนมัติ (Auto ID)
  const generateNextEmpId = () => {
    if (employees.length === 0) return 'E01';
    const numericIds = employees.map(emp => parseInt(emp.employee_id.replace(/[^0-9]/g, ''), 10)).filter(num => !isNaN(num));
    if (numericIds.length === 0) return 'E01';
    return `E${(Math.max(...numericIds) + 1).toString().padStart(2, '0')}`;
  };

  const handleAddClick = () => {
    setIsEditing(false);
    setFormData({ 
      employee_id: generateNextEmpId(), 
      username: '', 
      password: '', 
      first_name: '', 
      last_name: '', 
      role_id: 2, 
      phone: '', 
      is_active: true 
    });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleEditClick = (emp) => {
    setIsEditing(true);
    //  ดึงข้อมูลเดิมมาใส่ฟอร์ม รวมถึงรหัสผ่าน (password) ด้วย
    setFormData({ 
      employee_id: emp.employee_id,
      username: emp.username,
      password: emp.password, 
      first_name: emp.first_name,
      last_name: emp.last_name,
      role_id: emp.role_id,
      phone: emp.phone,
      is_active: emp.is_active
    });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    const url = isEditing ? `http://localhost:5000/api/employees/${formData.employee_id}` : 'http://localhost:5000/api/employees';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        Swal.fire({ icon: 'success', title: isEditing ? 'แก้ไขสำเร็จ!' : 'เพิ่มพนักงานสำเร็จ!', showConfirmButton: false, timer: 1500 });
        setShowModal(false);
        fetchEmployees(); 
      } else {
        const result = await response.json();
        Swal.fire('ผิดพลาด', result.message, 'error');
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
    }
  };

  const handleDelete = (id, firstName) => {
    Swal.fire({
      title: 'ยืนยันการลบ?', text: `คุณต้องการลบพนักงาน "${firstName}" ใช่หรือไม่?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#e74c3c', cancelButtonColor: '#9ca3af', confirmButtonText: 'ยืนยันการลบ'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:5000/api/employees/${id}`, { method: 'DELETE' });
          if (response.ok) {
            Swal.fire('ลบสำเร็จ!', 'ข้อมูลถูกลบออกจากระบบแล้ว', 'success');
            fetchEmployees(); 
          }
        } catch (error) {
          Swal.fire('ผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
        }
      }
    });
  };

  // ค้นหาพนักงาน
  const filteredEmployees = employees.filter((emp) => {
    const searchStr = searchTerm.toLowerCase();
    return (
      emp.employee_id.toLowerCase().includes(searchStr) ||
      emp.first_name.toLowerCase().includes(searchStr) ||
      emp.last_name.toLowerCase().includes(searchStr) ||
      emp.username.toLowerCase().includes(searchStr) ||
      (emp.phone && emp.phone.includes(searchStr))
    );
  });

  // แบ่งหน้า
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  // เพื่อดักบั๊กหน้าว่างเวลาลบข้อมูลหมดหน้า
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);
  const currentItems = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>จัดการพนักงาน</h2>
        <div className="header-actions">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="ค้นหารหัส, ชื่อ, เบอร์โทร..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn-add" onClick={handleAddClick}><FaPlus /> เพิ่มพนักงาน</button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>รหัส</th>
              <th>ชื่อ-นามสกุล</th>
              <th>ชื่อผู้ใช้</th>
              <th>เบอร์โทรศัพท์</th>
              <th>ตำแหน่ง</th>
              <th>สถานะ</th>
              <th style={{ width: '8%', textAlign: 'left' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((emp) => (
                <tr key={emp.employee_id}>
                  <td style={{ fontWeight: 'bold' }}>{emp.employee_id}</td>
                  <td className="emp-name">{emp.first_name} {emp.last_name}</td>
                  <td>{emp.username}</td>
                  <td>{emp.phone || '-'}</td>
                  <td>
                    <span className={`badge-role ${emp.role_id === 1 ? 'role-admin' : 'role-cashier'}`}>
                      {emp.role_name || (emp.role_id === 1 ? 'Admin' : 'Cashier')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge-status ${emp.is_active ? 'status-active' : 'status-inactive'}`}>
                      {emp.is_active ? 'ทำงาน' : 'ลาออก/พักงาน'}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <button className="btn-edit" onClick={() => handleEditClick(emp)} title="แก้ไข"><FaEdit /></button>
                    <button className="btn-delete" onClick={() => handleDelete(emp.employee_id, emp.first_name)} title="ลบ"><FaTrash /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" className="text-center no-data">ไม่พบข้อมูลพนักงาน</td></tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination-container">
            <span className="pagination-info">แสดงหน้าที่ {currentPage} จาก {totalPages}</span>
            <div className="pagination-buttons">
              <button className="page-btn" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}><FaChevronLeft /></button>
              {[...Array(totalPages)].map((_, index) => (
                <button key={index + 1} className={`page-btn ${currentPage === index + 1 ? 'active' : ''}`} onClick={() => paginate(index + 1)}>{index + 1}</button>
              ))}
              <button className="page-btn" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}><FaChevronRight /></button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>{isEditing ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            
            <form onSubmit={handleSaveEmployee}>
              <div className="form-row">
                <div className="form-group">
                  <label>รหัสพนักงาน (Auto)</label>
                  <input type="text" name="employee_id" value={formData.employee_id} readOnly style={{ backgroundColor: '#f1f3f5', cursor: 'not-allowed', color: '#6c757d' }} />
                </div>
                <div className="form-group">
                  <label>ตำแหน่ง</label>
                  <select name="role_id" value={formData.role_id} onChange={handleInputChange}>
                    <option value={1}>Admin</option>
                    <option value={2}>Cashier</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ชื่อ (First Name)</label>
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>นามสกุล (Last Name)</label>
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>เบอร์โทรศัพท์</label>
                  <input type="text" name="phone" value={formData.phone || ''} onChange={handleInputChange} placeholder="08X-XXX-XXXX" />
                </div>
                <div className="form-group">
                  <label>สถานะพนักงาน</label>
                  <select name="is_active" value={formData.is_active} onChange={handleInputChange}>
                    <option value={true}>ทำงาน (Active)</option>
                    <option value={false}>ลาออก/พักงาน (Inactive)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ชื่อผู้ใช้งาน (Username)</label>
                  <input type="text" name="username" value={formData.username} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>รหัสผ่าน (Password)</label>
                  <div className="password-input-wrapper">
                    {/*  รหัสผ่านกลับมาทำงานสมบูรณ์แล้ว */}
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password" 
                      value={formData.password || ''} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="กรอกรหัสผ่าน" 
                    />
                    <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>ยกเลิก</button>
                <button type="submit" className="btn-confirm">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeesPage;