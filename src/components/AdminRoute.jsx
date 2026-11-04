// src/components/AdminRoute.jsx
import { Result } from "antd";
import { Outlet } from "react-router-dom";

export function AdminRoute({ user }) {
  if (user?.role !== "admin") {
    return <Result status="403" title="Bu sayfa yönetici yetkisi ister." />;
  }
  return <Outlet />;
}
