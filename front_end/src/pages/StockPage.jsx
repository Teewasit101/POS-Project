import React, { useState, useEffect } from 'react';
import './StockPage.css'; 
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSearch, FaChevronLeft, FaChevronRight, FaBoxOpen } from 'react-icons/fa';
import Swal from 'sweetalert2';

function StockPage() {
  const [stockItems, setStockItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  const [formData, setFormData] = useState({
    ingredient_id: '', ingredient_name: '', total_quantity: '', unit: '', min_quantity: ''
  });

  useEffect(() => { fetchStock(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const fetchStock = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/stock');
      if (response.ok) setStockItems(await response.json());
    } catch (error) { console.error('Error:', error); }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateNextId = () => {
    if (stockItems.length === 0) return 'I01';
    const numericIds = stockItems.map(p => parseInt(p.ingredient_id.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n));
    return `I${(Math.max(...numericIds) + 1).toString().padStart(2, '0')}`;
  };

  // ฟังก์ชันแปลงวันที่ให้เป็นรูปแบบภาษาไทย เช่น 23 มี.ค. 2569
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleAddClick = () => {
    setIsEditing(false);
    setFormData({ ingredient_id: generateNextId(), ingredient_name: '', total_quantity: '', unit: '', min_quantity: '' });
    setShowModal(true);
  };

  const handleEditClick = (item) => {
    setIsEditing(true);
    // ตอนแก้ไข จะไม่อนุญาตให้แก้จำนวนสต็อกตรงๆ ต้องไปทำผ่านระบบรับของเข้า (ยึดตามหลัก POS ที่ดี)
    setFormData({ ...item, total_quantity: item.total_quantity }); 
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const url = isEditing ? `http://localhost:5000/api/stock/${formData.ingredient_id}` : 'http://localhost:5000/api/stock';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        Swal.fire({ icon: 'success', title: 'บันทึกสต็อกสำเร็จ', showConfirmButton: false, timer: 1500 });
        setShowModal(false);
        fetchStock();
      }
    } catch (error) { Swal.fire('ผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error'); }
  };

  const handleDelete = (id, name) => {
    Swal.fire({
      title: 'ยืนยันการลบ?', text: `ต้องการลบ "${name}" ออกจากระบบ?`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#e74c3c', confirmButtonText: 'ลบข้อมูล'
    }).then(async (res) => {
      if (res.isConfirmed) {
        const response = await fetch(`http://localhost:5000/api/stock/${id}`, { method: 'DELETE' });
        if (response.ok) { Swal.fire('ลบแล้ว!', '', 'success'); fetchStock(); }
      }
    });
  };

  const filtered = stockItems.filter(item => item.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [stockItems, searchTerm, totalPages, currentPage]);
  
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStockStatus = (qty, minQty) => {
    if (qty <= 0) return { label: 'ของหมด', className: 'stock-out' };
    if (qty <= minQty) return { label: 'ใกล้หมด', className: 'stock-low' };
    return { label: 'ปกติ', className: 'stock-ok' };
  };

  
  return (
    <div className="prod-page-container">
      <div className="prod-header">
        <h2>จัดการสต็อกวัตถุดิบ (Ingredients)</h2>
        <div className="prod-header-actions">
          <div className="prod-search-box">
            <FaSearch className="prod-search-icon" />
            <input type="text" placeholder="ค้นหาวัตถุดิบ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn-add-prod" onClick={handleAddClick}><FaPlus /> เพิ่มวัตถุดิบ</button>
        </div>
      </div>

      <div className="prod-table-container">
        <table className="prod-table"> 
          <thead>
            <tr>
              <th>รหัส</th>
              <th>รายการวัตถุดิบ</th>
              <th>จำนวนคงเหลือ</th>
              <th>หน่วย</th>
              <th>อัปเดตล่าสุด</th> {/* เพิ่มหัวข้อตารางตรงนี้ */}
              <th>สถานะ</th>
              <th style={{ textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((item) => {
                const status = getStockStatus(item.total_quantity, item.min_quantity);
                return (
                  <tr key={item.ingredient_id}>
                    <td style={{ fontWeight: 'bold' }}>{item.ingredient_id}</td>
                    <td style={{ color: '#2c3e50', fontWeight: 'bold' }}>{item.ingredient_name}</td>
                    <td style={{ color: '#00bcd4', fontWeight: 'bold', fontSize: '16px' }}>
                      {Number(item.total_quantity).toLocaleString()}
                    </td>
                    <td>{item.unit}</td>
                    
                    {/*เพิ่มคอลัมน์แสดงวันที่ตรงนี้ (ก่อนคอลัมน์สถานะ) */}
                    <td style={{ color: '#6c757d', fontSize: '13px' }}>
                      {formatDate(item.last_update_date)}
                    </td>

                    <td>
                      <span className={`prod-badge ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <div className="prod-action-buttons">
                        <button className="prod-btn-edit" onClick={() => handleEditClick(item)}><FaEdit /></button>
                        <button className="prod-btn-delete" onClick={() => handleDelete(item.ingredient_id, item.ingredient_name)}><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
               <tr><td colSpan="7" className="prod-no-data">ไม่พบข้อมูลสต็อก</td></tr>
            )}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div className="prod-pagination">
            <span>แสดงหน้าที่ {currentPage} จาก {totalPages}</span>
            <div className="prod-page-btns">
              <button className="p-btn" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}><FaChevronLeft /></button>
              {[...Array(totalPages)].map((_, idx) => (
                <button key={idx + 1} className={`p-btn ${currentPage === idx + 1 ? 'active' : ''}`} onClick={() => setCurrentPage(idx + 1)}>{idx + 1}</button>
              ))}
              <button className="p-btn" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}><FaChevronRight /></button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="prod-modal-overlay">
          <div className="prod-modal-box">
            <div className="prod-modal-header">
              <h3>{isEditing ? 'แก้ไขข้อมูลวัตถุดิบ' : 'เพิ่มวัตถุดิบใหม่'}</h3>
              <button className="prod-close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="prod-form-row">
                <div className="prod-form-group">
                  <label>รหัสวัตถุดิบ</label>
                  <input type="text" value={formData.ingredient_id} readOnly className="prod-readonly" />
                </div>
                <div className="prod-form-group">
                  <label>ชื่อรายการ</label>
                  <input type="text" name="ingredient_name" value={formData.ingredient_name} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="prod-form-row">
                <div className="prod-form-group">
                  <label>จำนวน {isEditing && '(แก้ไขผ่านระบบรับของ)'}</label>
                  <input type="number" step="1" name="total_quantity" value={formData.total_quantity} onChange={handleInputChange} required readOnly={isEditing} className={isEditing ? "prod-readonly" : ""} />
                </div>
                <div className="prod-form-group">
                  <label>หน่วยนับ</label>
                  <input type="text" name="unit" value={formData.unit} onChange={handleInputChange} placeholder="เช่น ml, กรัม, ชิ้น" required />
                </div>
              </div>
              <div className="prod-form-group" style={{ marginBottom: '25px' }}>
                <label>จุดแจ้งเตือนของใกล้หมด (Min Quantity)</label>
                <input type="number" step="1" name="min_quantity" value={formData.min_quantity} onChange={handleInputChange} required />
              </div>
              <div className="prod-modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="prod-btn-cancel">ยกเลิก</button>
                <button type="submit" className="prod-btn-confirm">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockPage;