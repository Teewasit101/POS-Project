import React, { useState, useEffect } from 'react';
import './ProductsPage.css';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSearch, FaChevronLeft, FaChevronRight, FaImage, FaBookOpen } from 'react-icons/fa';
import Swal from 'sweetalert2';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // 🌟 เปลี่ยนชื่อตัวแปรให้ตรงกับ DB (quantity)
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recipeItems, setRecipeItems] = useState([]);
  const [ingredientsList, setIngredientsList] = useState([]); 
  const [recipeForm, setRecipeForm] = useState({ ingredient_id: '', quantity: '' });
  
  const handleManageRecipe = async (product) => {
    setSelectedProduct(product);
    try {
      const resRecipe = await fetch(`http://localhost:5000/api/recipes/${product.product_id}`);
      if (!resRecipe.ok) throw new Error('ไม่สามารถดึงข้อมูลสูตรชงได้');
      setRecipeItems(await resRecipe.json());

      const resIngredients = await fetch('http://localhost:5000/api/stock');
      if (!resIngredients.ok) throw new Error('ดึงข้อมูลวัตถุดิบไม่ได้');
      setIngredientsList(await resIngredients.json());

      setShowRecipeModal(true);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('ข้อผิดพลาด!', error.message, 'error');
    }
  };

  const handleAddRecipeItem = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${selectedProduct.product_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeForm)
      });
      const data = await response.json();

      if (response.ok) {
        const resRecipe = await fetch(`http://localhost:5000/api/recipes/${selectedProduct.product_id}`);
        if (resRecipe.ok) setRecipeItems(await resRecipe.json());
        setRecipeForm({ ingredient_id: '', quantity: '' }); // 🌟 เคลียร์ฟอร์ม
      } else {
        Swal.fire('แจ้งเตือน', data.message || 'เพิ่มส่วนผสมไม่ได้', 'warning');
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', 'เพิ่มส่วนผสมไม่ได้', 'error');
    }
  };

  const handleDeleteRecipeItem = async (recipeId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${recipeId}`, { method: 'DELETE' });
      if (response.ok) {
        setRecipeItems(recipeItems.filter(item => item.recipe_id !== recipeId));
      }
    } catch (error) {
      console.error('Error deleting recipe item:', error);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  const [formData, setFormData] = useState({
    product_id: '', product_name: '', price: '', category_id: '', image_url: '', is_available: true
  });

  useEffect(() => { 
    fetchProducts(); 
    fetchCategories(); 
  }, []);

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      Swal.fire({ title: 'กำลังอัปโหลด...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
      
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST', body: uploadData,
      });
      
      const data = await response.json();
      if (response.ok) {
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
    setFormData({ product_id: generateNextId(), product_name: '', price: '', category_id: '', image_url: '', is_available: true });
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

  const filtered = products.filter(p => {
    const matchSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategoryFilter === '' || String(p.category_id) === String(selectedCategoryFilter);
    return matchSearch && matchCategory;
  });
  
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [products, searchTerm, totalPages, currentPage]);
  
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="prod-page-container">
      <div className="prod-header">
        <h2>จัดการเมนูเครื่องดื่ม</h2>
        <div className="prod-header-actions">
          <select className="prod-filter-select" value={selectedCategoryFilter} onChange={(e) => setSelectedCategoryFilter(e.target.value)}>
            <option value=""> ทุกหมวดหมู่ </option>
            {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
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
              <th >รูปภาพ</th><th >รหัส</th><th >ชื่อเมนู</th><th >หมวดหมู่</th><th >ราคา</th><th >สถานะ</th><th style={{ width: '8%', textAlign: 'left' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((prod) => (
                <tr key={prod.product_id}>
                  <td><div className="prod-img-preview">{prod.image_url ? <img src={prod.image_url} alt="img" /> : <FaImage style={{color: '#ccc'}} />}</div></td>
                  <td style={{ fontWeight: 'bold' }}>{prod.product_id}</td>
                  <td style={{ color: '#2c3e50',fontWeight: 'bold' }}>{prod.product_name}</td>
                  <td><span className="prod-badge cat-blue">{prod.category_name}</span></td>
                  <td style={{ color: '#00bcd4', fontWeight: 'bold' }}>฿{Number(prod.price).toLocaleString()}</td>
                  <td><span className={`prod-badge ${prod.is_available ? 'stock-ok' : 'stock-out'}`}>{prod.is_available ? 'พร้อมขาย' : 'ของหมด'}</span></td>
                  <td >
                    <div className="prod-action-buttons">
                      <button className="prod-btn-recipe"  onClick={() => handleManageRecipe(prod)} title="จัดการสูตรชง"><FaBookOpen /></button>
                      <button className="prod-btn-edit" onClick={() => handleEditClick(prod)}><FaEdit /></button>
                      <button className="prod-btn-delete" onClick={() => handleDelete(prod.product_id, prod.product_name)}><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (<tr><td colSpan="7" className="prod-no-data">ไม่พบข้อมูลเมนูเครื่องดื่ม</td></tr>)}
          </tbody>
        </table>
        
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

      {showModal && (
        <div className="prod-modal-overlay">
          <div className="prod-modal-box">
            <div className="prod-modal-header">
              <h3>{isEditing ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</h3>
              <button className="prod-close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="prod-form-row">
                <div className="prod-form-group"><label>รหัสเมนู</label><input type="text" value={formData.product_id} readOnly className="prod-readonly" /></div>
                <div className="prod-form-group"><label>ราคา</label><input type="number" name="price" value={formData.price} onChange={handleInputChange} required /></div>
              </div>
              <div className="prod-form-group" style={{ marginBottom: '15px' }}><label>ชื่อเมนู</label><input type="text" name="product_name" value={formData.product_name} onChange={handleInputChange} required /></div>
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
              <div className="prod-form-group" style={{ marginBottom: '25px' }}>
                <label>รูปภาพสินค้า (อัปโหลด หรือ ใส่ Link URL)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" name="image_url" value={formData.image_url} onChange={handleInputChange} placeholder="วาง Link หรือกดปุ่มอัปโหลด ->" style={{ flex: 1 }} />
                  <input type="file" id="file-upload" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                  <label htmlFor="file-upload" className="prod-btn-upload"><FaImage style={{ marginRight: '5px' }}/> เลือกไฟล์รูป</label>
                </div>
              </div>
              <div className="prod-modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="prod-btn-cancel">ยกเลิก</button>
                <button type="submit" className="prod-btn-confirm">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
           Modal หน้าต่างจัดการสูตรชง (Recipe) 
          ========================================== */}
      {showRecipeModal && (
        <div className="prod-modal-overlay">
          <div className="prod-modal-box" style={{ maxWidth: '600px' }}>
            <div className="prod-modal-header">
              <h3>สูตรชง: {selectedProduct?.product_name}</h3>
              <button className="prod-close-btn" onClick={() => setShowRecipeModal(false)}><FaTimes /></button>
            </div>
            
            <form onSubmit={handleAddRecipeItem} style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>เลือกวัตถุดิบ</label>
                  <select required className="prod-recipe-select"  value={recipeForm.ingredient_id} onChange={(e) => setRecipeForm({...recipeForm, ingredient_id: e.target.value})}>
                    <option value="">-- กรุณาเลือก --</option>
                    {ingredientsList.map(ing => <option key={ing.ingredient_id} value={ing.ingredient_id}>{ing.ingredient_name} (หน่วย: {ing.unit})</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ปริมาณที่ใช้</label>
                  {/*  ปรับ step="1" เพราะ DB ของคุณเป็น Integer (รับเฉพาะจำนวนเต็ม) */}
                  <input type="number" className="qty-input" step="1" min="1" required placeholder="จำนวน"  value={recipeForm.quantity} onChange={(e) => setRecipeForm({...recipeForm, quantity: e.target.value})}/>
                </div>
                <button type="submit" className="prod-btn-confirm" style={{ backgroundColor: '#2ecc71', padding: '10px 15px', height: 'fit-content',textAlign: 'right' }}><FaPlus /> เพิ่ม</button>
              </div>
            </form>

            <div className="prod-table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <table className="prod-table" style={{ fontSize: '14px' }}>
                <thead>
                  <tr><th>วัตถุดิบ</th><th style={{ textAlign: 'right' }}>ปริมาณที่ใช้</th><th style={{ textAlign: 'center' }}>ลบ</th></tr>
                </thead>
                <tbody>
                  {recipeItems.length > 0 ? (
                    recipeItems.map(item => (
                      <tr key={item.recipe_id}>
                        <td style={{ fontWeight: 'bold' }}>{item.ingredient_name}</td>
                        {/*  ใช้ item.quantity ให้ตรงกับ DB */}
                        <td style={{ textAlign: 'right', color: '#00bcd4', fontWeight: 'bold' }}>{item.quantity} <span style={{ color: '#555', fontSize: '12px' }}>{item.unit}</span></td>
                        <td style={{ textAlign: 'center' }}><button onClick={() => handleDeleteRecipeItem(item.recipe_id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '16px' }}><FaTrash /></button></td>
                      </tr>
                    ))
                  ) : (<tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#aaa' }}>ยังไม่มีการผูกสูตรชง</td></tr>)}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsPage;