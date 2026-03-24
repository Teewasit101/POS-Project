import React, { useState, useEffect } from 'react';
import './POSPage.css';
import { FaSearch, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';

function POSPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State สำหรับตะกร้าสินค้า
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (response.ok) setProducts(await response.json());
    } catch (error) { console.error('Error fetching products', error); }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      if (response.ok) setCategories(await response.json());
    } catch (error) { console.error('Error fetching categories', error); }
  };

  // กรองสินค้าตามหมวดหมู่และช่องค้นหา
  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'All' || p.category_name === selectedCategory;
    const matchSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    // เช็คว่าต้องแสดงเฉพาะสินค้าที่สถานะพร้อมขายด้วย (เผื่ออนาคต)
    return matchCategory && matchSearch;
  });

  // ================= ระบบตะกร้าสินค้า =================
  const addToCart = (product) => {
    setCart(prevCart => {
      // เช็คว่ามีสินค้านี้ในตะกร้าหรือยัง
      const existingItem = prevCart.find(item => item.product_id === product.product_id);
      
      if (existingItem) {
        // ถ้ามีแล้ว ให้บวกจำนวนเพิ่ม
        return prevCart.map(item => 
          item.product_id === product.product_id 
            ? { ...item, qty: item.qty + 1 } 
            : item
        );
      } else {
        // ถ้ายังไม่มี ให้เพิ่มเข้าไปใหม่ (จำนวน = 1)
        return [...prevCart, { ...product, qty: 1 }];
      }
    });
  };

  const updateQuantity = (productId, amount) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product_id === productId) {
          const newQty = item.qty + amount;
          return newQty > 0 ? { ...item, qty: newQty } : item;
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    Swal.fire({
      title: 'ล้างตะกร้า?',
      text: "ต้องการยกเลิกออเดอร์นี้ทั้งหมดหรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'ใช่, ล้างเลย!'
    }).then((result) => {
      if (result.isConfirmed) setCart([]);
    });
  };

  // คำนวณยอดรวม
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const vat = subtotal * 0.07; // สมมติคิด VAT 7% (ถ้าไม่คิดให้ปรับเป็น 0)
  const total = subtotal + vat;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const finalTotal = Math.round(total);
    
    //  1. ดึงข้อมูล user จาก sessionStorage ที่หน้า Login เซฟไว้
    const loggedInUserStr = sessionStorage.getItem('user');
    
    //  2. ถอดรหัส (Parse) และดึง employee_id ออกมา (ถ้าไม่มีให้คืนค่าเป็น E01 ไว้กันแอปพัง)
    let currentEmployeeId = 'E01'; // ค่าเริ่มต้นกรณีเกิดข้อผิดพลาด
    let currentEmployeeName = 'พนักงาน';

    if (loggedInUserStr) {
      try {
        const userObj = JSON.parse(loggedInUserStr);
        // เช็คว่าใน Object user ของคุณ ใช้ชื่อ key ว่าอะไร (อาจจะเป็น id, employee_id หรือ emp_id)
        currentEmployeeId = userObj.employee_id || userObj.id || 'E01'; 
        currentEmployeeName = userObj.name || userObj.first_name || 'พนักงาน';
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    try {
      const response = await fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: cart, 
          total_amount: finalTotal,
          employee_id: currentEmployeeId // 🌟 ส่งรหัสพนักงานตัวจริงไป Backend
        })
      });

      const data = await response.json(); 

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'ชำระเงินสำเร็จ!',
          //  โชว์ชื่อแคชเชียร์ในบิลให้ชื่นใจด้วย
          text: `บันทึกออเดอร์หมายเลข #${data.order_id} (แคชเชียร์: ${currentEmployeeName})`, 
          showConfirmButton: false,
          timer: 2000
        });
        setCart([]); 
      } else {
        Swal.fire('ผิดพลาด', data.message || 'ไม่สามารถบันทึกออเดอร์ได้', 'error');
      }
    } catch (error) {
      console.error('Checkout Error:', error);
      Swal.fire('ผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error');
    }
  };

  return (
    <div className="pos-container">
      {/* ================= ฝั่งซ้าย: สินค้า ================= */}
      <div className="pos-main">
        <div className="pos-header">
          <h2>ระบบขายหน้าร้าน (POS)</h2>
          <div className="pos-search">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="ค้นหาสินค้า..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* ปุ่มหมวดหมู่ */}
        <div className="pos-categories">
          <button 
            className={`cat-btn ${selectedCategory === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            ทั้งหมด
          </button>
          {categories.map(cat => (
            <button 
              key={cat.category_id} 
              className={`cat-btn ${selectedCategory === cat.category_name ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.category_name)}
            >
              {cat.category_name}
            </button>
          ))}
        </div>

        {/* ตารางการ์ดสินค้า */}
        <div className="pos-product-grid">
          {filteredProducts.map(product => (
            <div key={product.product_id} className="pos-product-card" onClick={() => addToCart(product)}>
              <img 
                src={
                  product.image_url 
                    ? (product.image_url.startsWith('http') ? product.image_url : `http://localhost:5000${product.image_url}`) 
                    : 'https://via.placeholder.com/150'
                } 
                alt={product.product_name} 
                className="pos-product-img"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }} /* 🌟 ถ้ารูปโหลดไม่ขึ้นจริงๆ ให้โชว์รูปสีเทาแทน */
              />
              <div className="pos-product-name">{product.product_name}</div>
              <div className="pos-product-price">฿{Number(product.price).toLocaleString()}</div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#777' }}>ไม่พบสินค้าที่ค้นหา</p>
          )}
        </div>
      </div>

      {/* ================= ฝั่งขวา: ตะกร้า ================= */}
      <div className="pos-sidebar">
        <div className="cart-header">
          <h3>🛒 ออเดอร์ปัจจุบัน</h3>
        </div>
        
        <div className="cart-items">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', marginTop: '50px' }}>ยังไม่มีสินค้าในตะกร้า</div>
          ) : (
            cart.map(item => (
              <div key={item.product_id} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.product_name}</div>
                  <div className="cart-item-price">฿{item.price} / ชิ้น</div>
                </div>
                
                <div className="cart-item-actions">
                  <button className="qty-btn" onClick={() => updateQuantity(item.product_id, -1)}>-</button>
                  <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{item.qty}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.product_id, 1)}>+</button>
                  <div className="cart-item-total">฿{(item.price * item.qty).toLocaleString()}</div>
                  <button 
                    style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', marginLeft: '5px' }}
                    onClick={() => removeFromCart(item.product_id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-summary">
          <div className="summary-row">
            <span>ยอดรวม ({cart.reduce((sum, item) => sum + item.qty, 0)} ชิ้น)</span>
            <span>฿{subtotal.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>VAT (7%)</span>
            <span>฿{vat.toFixed(2)}</span>
          </div>
          <div className="summary-total">
            <span>ยอดสุทธิ</span>
            <span>฿{Math.ceil(total).toLocaleString()}</span>
          </div>
          
          <button className="btn-checkout" onClick={handleCheckout} disabled={cart.length === 0}>
            ชำระเงิน ฿{Math.ceil(total).toLocaleString()}
          </button>
          <button className="btn-clear" onClick={clearCart} disabled={cart.length === 0}>
            ยกเลิกออเดอร์
          </button>
        </div>
      </div>
    </div>
  );
}

export default POSPage;