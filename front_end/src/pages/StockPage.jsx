import React, { useState, useEffect } from 'react';
import './ProductsPage.css'; 
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSearch, FaChevronLeft, FaChevronRight, FaBoxOpen, FaPlusCircle, FaList,FaExclamationTriangle } from 'react-icons/fa';
import Swal from 'sweetalert2';

function StockPage() {
  const [stockItems, setStockItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State สำหรับระบบรับของเข้าและดูล็อต
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showLotsModal, setShowLotsModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [receiveData, setReceiveData] = useState({ quantity: '', purchase_date: '', expiration_date: '' });
  const [lotsData, setLotsData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  const [formData, setFormData] = useState({
    ingredient_id: '', ingredient_name: '', total_quantity: '', unit: '', min_quantity: '', expiration_date: ''
  });

  useEffect(() => { fetchStock(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const fetchStock = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/stock');
      if (response.ok) setStockItems(await response.json());
    } catch (error) { console.error('Error:', error); }
  };

  const handleInputChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
  const handleReceiveChange = (e) => { setReceiveData({ ...receiveData, [e.target.name]: e.target.value }); };

  const generateNextId = () => {
    if (stockItems.length === 0) return 'I01';
    const numericIds = stockItems.map(p => parseInt(p.ingredient_id.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n));
    return `I${(Math.max(...numericIds) + 1).toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

    
  };

  // ฟังก์ชันเช็คว่าวันที่นี้ หมดอายุหรือยัง? (เทียบกับวันนี้)
  const isExpired = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // รีเซ็ตเวลาเป็นเที่ยงคืนเพื่อเทียบแค่วันที่
    const expDate = new Date(dateString);
    return expDate < today;
  };

  //  ฟังก์ชันจัดการข้อมูลหลัก (เพิ่ม/แก้ไข/ลบ)
  const handleAddClick = () => {
    setIsEditing(false);
    setFormData({ ingredient_id: generateNextId(), ingredient_name: '', total_quantity: '', unit: '', min_quantity: '', expiration_date: '' });
    setShowModal(true);
  };

  const handleEditClick = (item) => {
    setIsEditing(true);
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
      const data = await response.json(); 
      if (response.ok) {
        Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', showConfirmButton: false, timer: 1500 });
        setShowModal(false);
        fetchStock();
      } else {
        Swal.fire({ icon: 'warning', title: 'เพิ่มข้อมูลไม่ได้!', text: data.message, confirmButtonColor: '#f5b041' });
      }
    } catch (error) { Swal.fire('ผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error'); }
  };

  const handleDelete = (id, name) => {
    Swal.fire({ title: 'ยืนยันการลบ?', text: `ต้องการลบ "${name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#e74c3c', confirmButtonText: 'ลบข้อมูล'
    }).then(async (res) => {
      if (res.isConfirmed) {
        const response = await fetch(`http://localhost:5000/api/stock/${id}`, { method: 'DELETE' });
        if (response.ok) { Swal.fire('ลบแล้ว!', '', 'success'); fetchStock(); }
      }
    });
  };

  //  ฟังก์ชันรับของเข้า (Stock In)
  const handleReceiveClick = (item) => {
    setSelectedIngredient(item);
    
    //  ดึงวันที่แบบบังคับให้ตรงกับเครื่องคอมพิวเตอร์ปัจจุบัน (ปี-เดือน-วัน)
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    setReceiveData({ quantity: '', purchase_date: today, expiration_date: '' });
    setShowReceiveModal(true);
  };

  const submitReceiveStock = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/stock/${selectedIngredient.ingredient_id}/receive`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiveData)
      });
      if (response.ok) {
        Swal.fire({ icon: 'success', title: 'รับของเข้าสต็อกสำเร็จ!', showConfirmButton: false, timer: 1500 });
        setShowReceiveModal(false);
        fetchStock(); // โหลดข้อมูลยอดรวมใหม่
      }
    } catch (error) { Swal.fire('ผิดพลาด', 'บันทึกข้อมูลไม่ได้', 'error'); }
  };

  //  ฟังก์ชันดูล็อตสินค้า
  const handleViewLotsClick = async (item) => {
    setSelectedIngredient(item);
    try {
      const response = await fetch(`http://localhost:5000/api/stock/${item.ingredient_id}/lots`);
      if (response.ok) {
        setLotsData(await response.json());
        setShowLotsModal(true);
      }
    } catch (error) { console.error('Error fetching lots'); }
  };

  //  ฟังก์ชันเคลียร์ล็อตสินค้าที่หมดอายุ
  const handleClearLot = (inventoryId) => {
    Swal.fire({
      title: 'เคลียร์สต็อกล็อตนี้?',
      text: "ต้องการตัดสต็อกล็อตนี้ทิ้ง (ของเสีย/หมดอายุ) ใช่หรือไม่? ยอดรวมจะลดลงทันที",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'เคลียร์ทิ้ง'
    }).then(async (res) => {
      if (res.isConfirmed) {
        const response = await fetch(`http://localhost:5000/api/stock/lot/${inventoryId}`, { method: 'DELETE' });
        if (response.ok) {
          // รีเฟรชข้อมูลในหน้าต่างล็อต
          const lotsRes = await fetch(`http://localhost:5000/api/stock/${selectedIngredient.ingredient_id}/lots`);
          if (lotsRes.ok) setLotsData(await lotsRes.json());
          
          // รีเฟรชยอดรวมในตารางหลัก
          fetchStock();
          Swal.fire('เคลียร์แล้ว!', 'ตัดสต็อกล็อตนี้ออกจากระบบเรียบร้อย', 'success');
        }
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
        <h2>จัดการสต็อกวัตถุดิบ (Inventory)</h2>
        <div className="prod-header-actions">
          <div className="prod-search-box">
            <FaSearch className="prod-search-icon" />
            <input type="text" placeholder="ค้นหาวัตถุดิบ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn-add-prod" onClick={handleAddClick}><FaPlus /> เพิ่มวัตถุดิบใหม่</button>
        </div>
      </div>

      <div className="prod-table-container">
        <table className="prod-table"> 
          <thead>
            <tr>
              <th>รหัส</th>
              <th>รายการวัตถุดิบ</th>
              <th>จำนวนรวม</th>
              <th>หน่วย</th>
              <th>อัปเดตล่าสุด</th>
              <th>สถานะ</th>
              <th style={{ width: '8px', textAlign: 'left' }}>จัดการสต็อก</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((item) => {
                const status = getStockStatus(item.total_quantity, item.min_quantity);
                return (
                  <tr key={item.ingredient_id}>
                    <td style={{ fontWeight: 'bold' }}>{item.ingredient_id}</td>
                    <td style={{ color: '#2c3e50', fontWeight: 'bold' }}>
                      {item.ingredient_name}
                      {/*  ถ้า Backend บอกว่ามีของหมดอายุ ให้โชว์ป้ายเตือนสีแดง! */}
                      {item.has_expired_lot && (
                        <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaExclamationTriangle /> มีล็อตที่หมดอายุ!
                        </div>
                      )}
                    </td>
                    <td style={{ color: '#00bcd4', fontWeight: 'bold', fontSize: '16px' }}>
                      {Number(item.total_quantity).toLocaleString()}
                    </td>
                    <td>{item.unit}</td>
                    <td style={{ color: '#6c757d', fontSize: '13px' }}>{formatDate(item.last_update_date)}</td>
                    <td><span className={`prod-badge ${status.className}`}>{status.label}</span></td>
                    <td>
                      <div className="prod-action-buttons">
                        {/*  ปุ่มใหม่: รับของเข้า (สีเขียว) และ ดูล็อต (สีฟ้า) */}
                        <button className="prod-btn-edit" style={{ backgroundColor: '#2ecc71' }} onClick={() => handleReceiveClick(item)} title="รับของเข้าสต็อก"><FaPlusCircle /></button>
                        <button className="prod-btn-edit" style={{ backgroundColor: '#3498db' }} onClick={() => handleViewLotsClick(item)} title="ดูรายละเอียดล็อตสินค้า"><FaList /></button>
                        
                        {/* ปุ่มแก้ไขข้อมูลหลัก และ ลบ */}
                        <button className="prod-btn-edit" onClick={() => handleEditClick(item)} title="แก้ไขข้อมูลวัตถุดิบ"><FaEdit /></button>
                        <button className="prod-btn-delete" onClick={() => handleDelete(item.ingredient_id, item.ingredient_name)} title="ลบข้อมูล"><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : ( <tr><td colSpan="7" className="prod-no-data">ไม่พบข้อมูลสต็อก</td></tr> )}
          </tbody>
        </table>
        {/* ปุ่มเลื่อนหน้า (Pagination) */}
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="prod-pagination">
                    <span className="pagination-info">แสดงหน้าที่ {currentPage} จาก {totalPages}</span>
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

      {/*  1. Modal เพิ่ม/แก้ไข ข้อมูลหลัก (ของเดิม) */}
      {showModal && (
        <div className="prod-modal-overlay">
          <div className="prod-modal-box">
            <div className="prod-modal-header">
              <h3>{isEditing ? 'แก้ไขข้อมูลหลักวัตถุดิบ' : 'เพิ่มวัตถุดิบใหม่ (ครั้งแรก)'}</h3>
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
                  <label>จำนวน {isEditing && '(แก้ไขผ่านปุ่มรับของเข้า)'}</label>
                  <input type="number" step="1" name="total_quantity" value={formData.total_quantity} onChange={handleInputChange} required readOnly={isEditing} className={isEditing ? "prod-readonly" : ""} />
                </div>
                <div className="prod-form-group">
                  <label>หน่วยนับ</label>
                  <input type="text" name="unit" value={formData.unit} onChange={handleInputChange} placeholder="เช่น ml, กรัม" required />
                </div>
              </div>
              <div className="prod-form-group" style={{ marginBottom: '25px' }}>
                <label>จุดแจ้งเตือนของใกล้หมด (Min Quantity)</label>
                <input type="number" step="1" name="min_quantity" value={formData.min_quantity} onChange={handleInputChange} required />
              </div>

              {/* เพิ่มกล่องกรอกวันหมดอายุตรงนี้ (ให้แสดงเฉพาะตอน "เพิ่มใหม่" เท่านั้น) */}
              {!isEditing && (
                <div className="prod-form-group" style={{ marginBottom: '25px' }}>
                  <label>วันหมดอายุของล็อตแรก (ถ้ามี)</label>
                  <input type="date" name="expiration_date" value={formData.expiration_date} onChange={handleInputChange} />
                </div>
              )}

              <div className="prod-modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="prod-btn-cancel">ยกเลิก</button>
                <button type="submit" className="prod-btn-confirm">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  2. Modal รับของเข้า (Stock In) */}
      {showReceiveModal && (
        <div className="prod-modal-overlay">
          <div className="prod-modal-box" style={{ maxWidth: '400px' }}>
            <div className="prod-modal-header">
              <h3>รับของเข้า: {selectedIngredient?.ingredient_name}</h3>
              <button className="prod-close-btn" onClick={() => setShowReceiveModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={submitReceiveStock}>
              <div className="prod-form-group" style={{ marginBottom: '15px' }}>
                <label>จำนวนที่รับเข้า ({selectedIngredient?.unit})</label>
                <input type="number" step="1" name="quantity" value={receiveData.quantity} onChange={handleReceiveChange} required />
              </div>
              <div className="prod-form-group" style={{ marginBottom: '15px' }}>
                <label>วันที่ซื้อ/รับเข้า</label>
                <input type="date" name="purchase_date" value={receiveData.purchase_date} onChange={handleReceiveChange} required />
              </div>
              <div className="prod-form-group" style={{ marginBottom: '25px' }}>
                <label>วันหมดอายุ (ถ้ามี)</label>
                <input type="date" name="expiration_date" value={receiveData.expiration_date} onChange={handleReceiveChange} />
              </div>
              <div className="prod-modal-footer">
                <button type="button" onClick={() => setShowReceiveModal(false)} className="prod-btn-cancel">ยกเลิก</button>
                <button type="submit" className="prod-btn-confirm" style={{ backgroundColor: '#2ecc71' }}>บันทึกรับของ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  3. Modal ดูรายละเอียดล็อตสินค้า */}
      {showLotsModal && (
        <div className="prod-modal-overlay">
          <div className="prod-modal-box" style={{ maxWidth: '600px' }}>
            <div className="prod-modal-header">
              <h3>ล็อตสินค้า: {selectedIngredient?.ingredient_name}</h3>
              <button className="prod-close-btn" onClick={() => setShowLotsModal(false)}><FaTimes /></button>
            </div>
            <div className="prod-table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="prod-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>รหัสล็อต</th>
                    <th>วันที่ซื้อ</th>
                    <th>วันหมดอายุ</th>
                    <th>จำนวนคงเหลือ</th>
                    <th style={{ textAlign: 'center' }}>จัดการ</th> {/* 🌟 เพิ่มหัวคอลัมน์ */}
                  </tr>
                </thead>
                <tbody>
                  {lotsData.length > 0 ? (
                    lotsData.map(lot => {
                      const expired = isExpired(lot.expiration_date); // เช็คว่าล็อตนี้หมดอายุไหม
                      return (
                        <tr key={lot.inventory_id} style={{ backgroundColor: expired ? '#fee2e2' : 'transparent' }}> {/* ถ้าหมดอายุ พื้นหลังเป็นสีแดงอ่อน */}
                          <td style={{ color: expired ? '#dc2626' : 'inherit' }}>Lot-{lot.inventory_id}</td>
                          <td style={{ color: expired ? '#dc2626' : 'inherit' }}>{formatDate(lot.purchase_date)}</td>
                          <td style={{ color: expired ? '#dc2626' : (lot.expiration_date ? '#e74c3c' : '#adb5bd'), fontWeight: 'bold' }}>
                            {formatDate(lot.expiration_date)}
                            {expired && <span style={{ marginLeft: '8px', fontSize: '11px', backgroundColor: '#dc2626', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>หมดอายุ!</span>}
                          </td>
                          <td style={{ fontWeight: 'bold', color: expired ? '#dc2626' : 'inherit' }}>{lot.quantity} {selectedIngredient?.unit}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button onClick={() => handleClearLot(lot.inventory_id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '16px' }} title="เคลียร์สต็อกล็อตนี้ทิ้ง"><FaTrash /></button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="5" className="prod-no-data">ไม่พบข้อมูลในสต็อก</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="prod-modal-footer">
              <button type="button" onClick={() => setShowLotsModal(false)} className="prod-btn-cancel">ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockPage;