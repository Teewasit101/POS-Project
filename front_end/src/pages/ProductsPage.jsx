import React, { useState, useEffect } from 'react';
import './ProductsPage.css';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSearch, FaChevronLeft, FaChevronRight, FaImage } from 'react-icons/fa';
import Swal from 'sweetalert2';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  const [formData, setFormData] = useState({
    product_id: '', product_name: '', price: '', category_id: '', image_url: '', is_available: true
  });

  useEffect(() => { 
    fetchProducts(); 
    fetchCategories(); 
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedCategoryFilter]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (response.ok) setProducts(await response.json());
    } catch (error) { console.error('Error:', error); }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      if (response.ok) setCategories(await response.json());
    } catch (error) { console.error('Error:', error); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'is_available') {
      setFormData({ ...formData, [name]: value === 'true' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ฟังก์ชันใหม่สำหรับจัดการเวลาผู้ใช้เลือกไฟล์
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      // โชว์แจ้งเตือนกำลังอัปโหลด
      Swal.fire({ title: 'กำลังอัปโหลด...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
      
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      
      const data = await response.json();
      if (response.ok) {
        // อัปโหลดสำเร็จ เอา Link ที่ได้มาใส่ในช่อง image_url อัตโนมัติ
        setFormData({ ...formData, image_url: data.imageUrl });
        Swal.fire({ icon: 'success', title: 'อัปโหลดสำเร็จ!', showConfirmButton: false, timer: 1500 });
      } else {
        Swal.fire('ผิดพลาด', 'ไม่สามารถอัปโหลดรูปได้', 'error');
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error');
    }
  };

  const generateNextId = () => {
    if (products.length === 0) return 'P01';
    const numericIds = products.map(p => parseInt(p.product_id.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n));
    return `P${(Math.max(...numericIds) + 1).toString().padStart(2, '0')}`;
  };

  const handleAddClick = () => {
    setIsEditing(false);
    setFormData({ 
      product_id: generateNextId(), 
      product_name: '', 
      price: '', 
      category_id: '', 
      image_url: '', 
      is_available: true 
    });
    setShowModal(true);
  };

  const handleEditClick = (prod) => {
    setIsEditing(true);
    setFormData({ ...prod, image_url: prod.image_url || '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.category_id) return Swal.fire('แจ้งเตือน', 'กรุณาเลือกหมวดหมู่', 'warning');

    const url = isEditing ? `http://localhost:5000/api/products/${formData.product_id}` : 'http://localhost:5000/api/products';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', showConfirmButton: false, timer: 1500 });
        setShowModal(false);
        fetchProducts();
      }
    } catch (error) { Swal.fire('ผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error'); }
  };

  const handleDelete = (id, name) => {
    Swal.fire({
      title: 'ยืนยันการลบ?', text: `ต้องการลบเมนู "${name}"?`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#e74c3c', confirmButtonText: 'ลบข้อมูล'
    }).then(async (res) => {
      if (res.isConfirmed) {
        const response = await fetch(`http://localhost:5000/api/products/${id}`, { method: 'DELETE' });
        if (response.ok) { Swal.fire('ลบแล้ว!', '', 'success'); fetchProducts(); }
      }
    });
  };

  // ปรับระบบกรองให้เช็คทั้ง ชื่อเมนู และ หมวดหมู่
  const filtered = products.filter(p => {
    const matchSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategoryFilter === '' || String(p.category_id) === String(selectedCategoryFilter);
    return matchSearch && matchCategory;
  });
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  //  เพื่อดักการถอยหน้าอัตโนมัติ
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [products, searchTerm, totalPages, currentPage]);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="prod-page-container">
      <div className="prod-header">
        <h2>จัดการเมนูเครื่องดื่ม</h2>
        <div className="prod-header-actions">
          {/*เพิ่ม Dropdown กรองหมวดหมู่ตรงนี้ */}
          <select 
            className="prod-filter-select"
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          >
            <option value=""> ทุกหมวดหมู่ </option>
            {categories.map(c => (
              <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
            ))}
          </select>

          <div className="prod-search-box">
            <FaSearch className="prod-search-icon" />
            <input type="text" placeholder="ค้นหาเมนู..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn-add-prod" onClick={handleAddClick}><FaPlus /> เพิ่มเมนู</button>
        </div>
      </div>

      <div className="prod-table-container">
        <table className="prod-table"> 
          <thead>
            <tr>
              <th >รูปภาพ</th>
              <th >รหัส</th>
              <th >ชื่อเมนู</th>
              <th >หมวดหมู่</th>
              <th >ราคา</th>
              <th >สถานะ</th>
              <th style={{ width: '8%', textAlign: 'left' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((prod) => (
                <tr key={prod.product_id}>
                  <td>
                    <div className="prod-img-preview">
                      {prod.image_url ? <img src={prod.image_url} alt="img" /> : <FaImage style={{color: '#ccc'}} />}
                    </div>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{prod.product_id}</td>
                  <td style={{ color: '#2c3e50',fontWeight: 'bold' }}>{prod.product_name}</td>
                  <td><span className="prod-badge cat-blue">{prod.category_name}</span></td>
                  <td style={{ color: '#2c3e50', fontWeight: 'bold' }}>฿{Number(prod.price).toLocaleString()}</td>
                  <td>
                    <span className={`prod-badge ${prod.is_available ? 'stock-ok' : 'stock-out'}`}>
                      {prod.is_available ? 'พร้อมขาย' : 'ของหมด'}
                    </span>
                  </td>
                  <td >
                    <div className="prod-action-buttons">
                      <button className="prod-btn-edit" onClick={() => handleEditClick(prod)}><FaEdit /></button>
                      <button className="prod-btn-delete" onClick={() => handleDelete(prod.product_id, prod.product_name)}><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
               <tr><td colSpan="7" className="prod-no-data">ไม่พบข้อมูลเมนูเครื่องดื่ม</td></tr>
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
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
              <h3>{isEditing ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</h3>
              <button className="prod-close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="prod-form-row">
                <div className="prod-form-group">
                  <label>รหัสเมนู</label>
                  <input type="text" value={formData.product_id} readOnly className="prod-readonly" />
                </div>
                <div className="prod-form-group">
                  <label>ราคา</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="prod-form-group" style={{ marginBottom: '15px' }}>
                <label>ชื่อเมนู</label>
                <input type="text" name="product_name" value={formData.product_name} onChange={handleInputChange} required />
              </div>
              <div className="prod-form-row">
                <div className="prod-form-group">
                  <label>หมวดหมู่</label>
                  <select name="category_id" value={formData.category_id} onChange={handleInputChange} required>
                    <option value="" disabled>-- เลือกหมวดหมู่ --</option>
                    {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                  </select>
                </div>
                <div className="prod-form-group">
                  <label>สถานะสินค้า</label>
                  <select name="is_available" value={formData.is_available} onChange={handleInputChange}>
                    <option value={true}>พร้อมขาย (Available)</option>
                    <option value={false}>ของหมด (Out of Stock)</option>
                  </select>
                </div>
              </div>
              {/* ช่องใส่รูปภาพแบบผสม (ใส่ Link เอง หรือ อัปโหลดจากเครื่อง) */}
              {/* ช่องใส่รูปภาพแบบผสม (ใส่ Link เอง หรือ อัปโหลดจากเครื่อง) */}
              <div className="prod-form-group" style={{ marginBottom: '25px' }}>
                <label>รูปภาพสินค้า (อัปโหลด หรือ ใส่ Link URL)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" name="image_url" value={formData.image_url} onChange={handleInputChange} placeholder="วาง Link หรือกดปุ่มอัปโหลด ->" style={{ flex: 1 }} />
                  
                  {/* ปุ่มอัปโหลดไฟล์ (ซ่อน input file ไว้ แล้วใช้ label แทนให้ปุ่มสวยๆ) */}
                  <input type="file" id="file-upload" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                  <label htmlFor="file-upload" className="prod-btn-upload">
                    <FaImage style={{ marginRight: '5px' }}/> เลือกไฟล์รูป
                  </label>
                </div>
              </div>

              {/* 🌟🌟 ส่วนที่หายไป: เอากลับมาใส่ตรงนี้ครับ 🌟🌟 */}
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

export default ProductsPage;