import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import Layout from "./components/Layout";
import SalesPage from "./pages/SalesPage";
import EmployeesPage from "./pages/EmployeesPage";
import ProductsPage from "./pages/ProductsPage";
import ReportsPage from "./pages/ReportsPage";
import StockPage from "./pages/StockPage";
import LoginPage from "./pages/LoginPage";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<Layout />}>
        <Route path="/login/sales" element={<SalesPage />} />
        <Route path="/login/employees" element={<EmployeesPage />} />
        <Route path="/login/products" element={<ProductsPage />} />
        <Route path="/login/reports" element={<ReportsPage />} />
        <Route path="/login/stocks" element={<StockPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
