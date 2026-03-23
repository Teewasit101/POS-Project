import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import Layout from "./components/Layout";
import SalesPage from "./pages/SalesPage";
import EmployeesPage from "./pages/EmployeesPage";
import ProductsPage from "./pages/ProductsPage";
import ReportsPage from "./pages/ReportsPage";
import StockPage from "./pages/StockPage";
import LoginPage from "./pages/LoginPage";
import RolesPage from './pages/RolesPage';


// เช็คว่าเคยล็อกอินไว้หรือยัง โดยดึงข้อมูลจาก LocalStorage
// ไฟล์: main.jsx
// เปลี่ยนจาก localStorage เป็น sessionStorage
const isLoggedIn = sessionStorage.getItem("user");

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      {/* 1. หน้า Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* 2. เช็คเงื่อนไข: ถ้าล็อกอินแล้ว (isLoggedIn) ให้โชว์ Layout แต่ถ้ายัง ให้เด้งไปหน้า /login */}
      <Route path="/" element={isLoggedIn ? <Layout /> : <Navigate to="/login" replace />}>
        <Route path="sales" element={<SalesPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="stocks" element={<StockPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);