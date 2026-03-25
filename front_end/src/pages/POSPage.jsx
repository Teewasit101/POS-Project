import React, { useState, useEffect } from 'react';
import './POSPage.css';
import { FaSearch, FaTrash, FaMoneyBillWave, FaQrcode, FaPrint, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';

function POSPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);

  // 🌟 State สำหรับระบบชำระเงิน
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('เงินสด'); // 'เงินสด' หรือ 'โอนเงิน'
  const [amountReceived, setAmountReceived] = useState('');
  
  // 🌟 State สำหรับใบเสร็จ
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

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

  const getImageUrl = (path) => {
    if (!path) return 'https://placehold.co/150x150?text=No+Image'; 
    if (path.includes('http')) return path; 
    return `http://localhost:5000${path.startsWith('/') ? path : `/${path}`}`;
  };

  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'All' || p.category_name === selectedCategory;
    const matchSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch; 
  });

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product_id === product.product_id);
      const currentQty = existingItem ? existingItem.qty : 0;
      if (currentQty + 1 > product.max_qty) {
        Swal.fire('วัตถุดิบไม่พอ!', `"${product.product_name}" เหลือวัตถุดิบชงได้อีกแค่ ${product.max_qty} ที่ครับ`, 'warning');
        return prevCart;
      }
      if (existingItem) return prevCart.map(item => item.product_id === product.product_id ? { ...item, qty: item.qty + 1 } : item);
      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  const updateQuantity = (productId, amount) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.qty + amount;
        if (amount > 0 && newQty > item.max_qty) {
          Swal.fire('วัตถุดิบไม่พอ!', `ชงได้สูงสุดแค่ ${item.max_qty} ที่ครับ`, 'warning');
          return item;
        }
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => setCart(prevCart => prevCart.filter(item => item.product_id !== productId));
  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const changeAmount = paymentMethod === 'เงินสด' && amountReceived ? Math.max(0, parseInt(amountReceived) - total) : 0;

  //  ฟังก์ชันเปิดหน้าต่างจ่ายเงิน
  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setPaymentMethod('เงินสด');
    setAmountReceived(total); // ค่าเริ่มต้นรับเงินพอดี
    setShowPaymentModal(true);
  };

  //  ฟังก์ชันยืนยันการชำระเงินเข้า Database
  const confirmPayment = async () => {
    
    // ==========================================
    //  ระบบดักจับข้อผิดพลาด (Validation) สุดแกร่ง
    // ==========================================
    if (paymentMethod === 'เงินสด') {
      const received = parseInt(amountReceived);
      
      // 1. ดักกรณีไม่ได้กรอกอะไรเลย หรือกรอกไม่ใช่ตัวเลข
      if (!amountReceived || isNaN(received) || received <= 0) {
        return Swal.fire('แจ้งเตือน', 'กรุณากรอกจำนวนเงินรับให้ถูกต้องครับ', 'warning');
      }
      
      // 2. ดักกรณีรับเงินมาน้อยกว่ายอดที่ต้องจ่าย (บอกด้วยว่าขาดกี่บาท)
      if (received < total) {
        const missingAmount = total - received;
        return Swal.fire('แจ้งเตือน', `รับเงินมาไม่ครบครับ (ขาดอีก ฿${missingAmount.toLocaleString()})`, 'warning');
      }
    }

    const finalTotal = Math.round(total);
    const loggedInUserStr = sessionStorage.getItem('user');
    let currentEmployeeId = 'E01'; 
    let currentEmployeeName = 'พนักงาน';

    if (loggedInUserStr) {
      try {
        const userObj = JSON.parse(loggedInUserStr);
        currentEmployeeId = userObj.employee_id || userObj.id || 'E01'; 
        currentEmployeeName = userObj.name || userObj.first_name || 'พนักงาน';
      } catch (e) { console.error("Error parsing user data:", e); }
    }

    try {
      // โชว์โหลดดิ้งระหว่างตัดสต็อก
      Swal.fire({ title: 'กำลังประมวลผล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const response = await fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cart: cart, 
          total_amount: finalTotal, 
          employee_id: currentEmployeeId,
          payment_method: paymentMethod,
          amount_received: paymentMethod === 'เงินสด' ? parseInt(amountReceived) : finalTotal,
          change_amount: changeAmount
        })
      });
      const data = await response.json(); 

      if (response.ok) {
        Swal.close();
        setShowPaymentModal(false);
        // เตรียมข้อมูลใบเสร็จ
        setCompletedOrder({
          order_id: data.order_id,
          date: new Date(data.created_at).toLocaleString('th-TH'),
          items: [...cart],
          total: finalTotal,
          payment_method: paymentMethod,
          amount_received: paymentMethod === 'เงินสด' ? parseInt(amountReceived) : finalTotal,
          change_amount: changeAmount,
          cashier: currentEmployeeName
        });
        setCart([]); 
        fetchProducts(); 
        setShowReceiptModal(true); // เปิดหน้าต่างใบเสร็จ
      } else {
        Swal.fire('ผิดพลาด', data.message || 'ไม่สามารถบันทึกออเดอร์ได้', 'error');
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error');
    }
  };

  //  ฟังก์ชันปรินท์ใบเสร็จ
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pos-container">
      <div className="pos-main">
        <div className="pos-header">
          <h2>ระบบขายหน้าร้าน (POS)</h2>
          <div className="pos-search"><FaSearch className="search-icon" /><input type="text" placeholder="ค้นหาสินค้า..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        </div>

        <div className="pos-categories">
          <button className={`cat-btn ${selectedCategory === 'All' ? 'active' : ''}`} onClick={() => setSelectedCategory('All')}>ทั้งหมด</button>
          {categories.map(cat => (
            <button key={cat.category_id} className={`cat-btn ${selectedCategory === cat.category_name ? 'active' : ''}`} onClick={() => setSelectedCategory(cat.category_name)}>{cat.category_name}</button>
          ))}
        </div>

        <div className="pos-product-grid">
          {filteredProducts.map(product => {
            const isReadyToSell = product.max_qty > 0;
            return (
              <div key={product.product_id} className={`pos-product-card ${!isReadyToSell ? 'sold-out' : ''}`} onClick={() => { if (!isReadyToSell) { Swal.fire('ขออภัย', 'สินค้าหมด', 'warning'); } else { addToCart(product); } }}>
                <img src={getImageUrl(product.image_url || product.image)} alt={product.product_name} className="pos-product-img" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x150?text=Error'; }} />
                <div className="pos-product-name">{product.product_name}</div>
                <div className="pos-product-price">฿{Number(product.price).toLocaleString()}</div>
                {!isReadyToSell && <div className="sold-out-overlay">สินค้าหมด</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pos-sidebar">
        <div className="cart-header"><h3>🛒 ออเดอร์ปัจจุบัน</h3></div>
        <div className="cart-items">
          {cart.length === 0 ? <div style={{ textAlign: 'center', color: '#aaa', marginTop: '50px' }}>ยังไม่มีสินค้าในตะกร้า</div> : cart.map(item => (
            <div key={item.product_id} className="cart-item">
              <div className="cart-item-info"><div className="cart-item-name">{item.product_name}</div><div className="cart-item-price">฿{item.price} / ชิ้น</div></div>
              <div className="cart-item-actions">
                <button className="qty-btn" onClick={() => updateQuantity(item.product_id, -1)}>-</button>
                <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{item.qty}</span>
                <button className="qty-btn" onClick={() => updateQuantity(item.product_id, 1)}>+</button>
                <div className="cart-item-total">฿{(item.price * item.qty).toLocaleString()}</div>
                <button style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', marginLeft: '5px' }} onClick={() => removeFromCart(item.product_id)}><FaTrash /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-summary">
          <div className="summary-row"><span>จำนวนสินค้ารวม</span><span>{cart.reduce((sum, item) => sum + item.qty, 0)} ชิ้น</span></div>
          <div className="summary-total"><span>ยอดสุทธิ</span><span>฿{total.toLocaleString()}</span></div>
          {/* เปลี่ยนปุ่ม Checkout เป็นเปิดหน้าต่างจ่ายเงิน */}
          <button className="btn-checkout" onClick={handleOpenPayment} disabled={cart.length === 0}>ชำระเงิน ฿{total.toLocaleString()}</button>
          <button className="btn-clear" onClick={clearCart} disabled={cart.length === 0}>ยกเลิกออเดอร์</button>
        </div>
      </div>

      {/* =================  Modal การชำระเงิน ================= */}
      {showPaymentModal && (
        <div className="prod-modal-overlay no-print">
          <div className="prod-modal-box" style={{ maxWidth: '400px' }}>
            <div className="prod-modal-header">
              <h3>เลือกช่องทางการชำระเงิน</h3>
              <button className="prod-close-btn" onClick={() => setShowPaymentModal(false)}><FaTimes /></button>
            </div>
            
            <div className="payment-methods">
              <button className={`pay-btn ${paymentMethod === 'เงินสด' ? 'active' : ''}`} onClick={() => setPaymentMethod('เงินสด')}><FaMoneyBillWave /> เงินสด</button>
              <button className={`pay-btn ${paymentMethod === 'โอนเงิน' ? 'active' : ''}`} onClick={() => setPaymentMethod('โอนเงิน')}><FaQrcode /> โอนเงิน (QR)</button>
            </div>

            <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
                <span>ยอดที่ต้องชำระ:</span>
                <span style={{ color: '#e74c3c' }}>฿{total.toLocaleString()}</span>
              </div>

              {paymentMethod === 'เงินสด' ? (
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>รับเงินมา (บาท)</label>
                  <input type="number" className="prod-form-group-input" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', marginTop: '15px', color: changeAmount > 0 ? '#2ecc71' : '#555' }}>
                    <span>เงินทอน:</span>
                    <span style={{ fontWeight: 'bold' }}>฿{changeAmount.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="qr-container">
                  <img src="https://promptpay.io/0812345678.png" alt="QR Code" style={{ width: '150px', height: '150px' }} />
                  <p style={{ marginTop: '10px', color: '#555' }}>สแกนเพื่อจ่าย ฿{total.toLocaleString()}</p>
                </div>
              )}
            </div>

            <button className="btn-checkout" style={{ width: '100%', fontSize: '18px', padding: '15px' }} onClick={confirmPayment}>ยืนยันการรับเงิน</button>
          </div>
        </div>
      )}

      {/* =================  Modal ใบเสร็จ (พิมพ์ได้) ================= */}
      {showReceiptModal && completedOrder && (
        <div className="prod-modal-overlay">
          {/*  1. ลบคำว่า no-print ออกจากบรรทัดนี้ ไม่งั้นมันจะซ่อนทั้งกล่อง */}
          <div className="prod-modal-box" style={{ maxWidth: '350px', background: 'transparent', boxShadow: 'none' }}>
            
            <div className="receipt-paper">
              <div className="receipt-header">
                <h3 style={{ margin: 0 }}>POS CAFE</h3>
                <p style={{ margin: '5px 0', fontSize: '12px' }}>ใบเสร็จรับเงิน / ย่อ</p>
                <div style={{ fontSize: '12px', textAlign: 'left', marginTop: '10px' }}>
                  <div>เลขที่บิล: #{completedOrder.order_id}</div>
                  <div>วันที่: {completedOrder.date}</div>
                  <div>แคชเชียร์: {completedOrder.cashier}</div>
                </div>
              </div>

              <div style={{ borderBottom: '1px dashed #333', paddingBottom: '10px', marginBottom: '10px' }}>
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="receipt-item">
                    <span>{item.qty}x {item.product_name}</span>
                    <span>฿{(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="receipt-item receipt-total"><span>ยอดรวมทั้งสิ้น</span><span>฿{completedOrder.total.toLocaleString()}</span></div>
              <div className="receipt-item" style={{ marginTop: '10px' }}><span>ชำระโดย</span><span>{completedOrder.payment_method}</span></div>
              <div className="receipt-item"><span>รับเงิน</span><span>฿{completedOrder.amount_received.toLocaleString()}</span></div>
              <div className="receipt-item"><span>เงินทอน</span><span>฿{completedOrder.change_amount.toLocaleString()}</span></div>

              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px' }}>
                <p>ขอบคุณที่ใช้บริการครับ/ค่ะ</p>
              </div>
            </div>

            {/*  2. ย้าย no-print มาใส่ที่กล่องปุ่มกดแทน (ให้ซ่อนแค่ปุ่มตอนปรินท์) */}
            <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="prod-btn-confirm" style={{ flex: 1, backgroundColor: '#34495e' }} onClick={handlePrint}><FaPrint /> พิมพ์ใบเสร็จ</button>
              <button className="prod-btn-cancel" style={{ flex: 1 }} onClick={() => setShowReceiptModal(false)}>ปิดหน้าต่าง</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default POSPage;