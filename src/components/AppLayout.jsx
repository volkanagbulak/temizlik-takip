// src/components/AppLayout.jsx
import { Layout } from "antd";
import { Navigate, Outlet } from "react-router-dom";
import { Menu } from "./Menu";

export function AppLayout({ user, onLogout }) {
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout.Header>
        <Menu user={user} onLogout={onLogout} />
      </Layout.Header>
      <Layout.Content style={{ padding: 16 }}>
        <Outlet />
      </Layout.Content>
    </Layout>
  );
}
