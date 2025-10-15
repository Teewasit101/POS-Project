
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import Layout from "./components/Layout";
import SalesPage from "./pages/SalesPage";
import EmployeesPage from "./pages/EmployeesPage";
import ProductsPage from "./pages/ProductsPage";
import ReportsPage from "./pages/ReportsPage";
import StockPage from "./pages/StockPage";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="sales" element={<SalesPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="stocks" element={<StockPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
