// src/components/AppLayout.jsx
import { Avatar, Button, Flex, Layout, Tag, Typography } from "antd";
import { LogoutOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Navigate, Outlet } from "react-router-dom";
import { Menu } from "./Menu";

const line = "1px solid #eceff1";

// Tüm sayfaların ortak çerçevesi. Giriş yapmayan kişi buradan login ekranına dönüyor.
export function AppLayout({ user, onLogout }) {
  if (!user) return <Navigate to="/login" replace />;

  const isAdmin = user.role === "admin";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout.Sider
        width={240}
        breakpoint="lg"
        collapsedWidth={0}
        zeroWidthTriggerStyle={{
          top: 12,
          background: "#0f766e",
          color: "#fff",
        }}
        style={{ borderInlineEnd: line }}
      >
        <Flex align="center" gap={10} style={{ height: 64, padding: "0 24px" }}>
          <SafetyCertificateOutlined
            style={{ fontSize: 22, color: "#0f766e" }}
          />
          <Typography.Text strong style={{ fontSize: 16 }}>
            Temizlik Takip
          </Typography.Text>
        </Flex>
        <Menu user={user} />
      </Layout.Sider>

      <Layout>
        <Layout.Header style={{ borderBottom: line }}>
          <Flex
            align="center"
            justify="flex-end"
            gap={12}
            style={{ height: "100%" }}
          >
            <Avatar style={{ background: "#0f766e" }}>{user.name[0]}</Avatar>
            <Typography.Text>{user.name}</Typography.Text>
            <Tag color={isAdmin ? "blue" : "green"}>
              {isAdmin ? "Yönetici" : "Operatör"}
            </Tag>
            <Button type="text" icon={<LogoutOutlined />} onClick={onLogout}>
              Çıkış
            </Button>
          </Flex>
        </Layout.Header>
        <Layout.Content style={{ padding: 24 }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
