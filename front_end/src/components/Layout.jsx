import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ marginLeft: "250px", padding: "20px", flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
