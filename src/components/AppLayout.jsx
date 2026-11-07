// src/components/AppLayout.jsx
import { useEffect, useState } from "react";
import { Avatar, Button, Drawer, Flex, Grid, Layout, Tag, Typography } from "antd";
import { LogoutOutlined, MenuOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Navigate, Outlet } from "react-router-dom";
import { Menu } from "./Menu";

const line = "1px solid #eceff1";

function Brand() {
  return (
    <Flex align="center" gap={10} style={{ height: 64, padding: "0 24px" }}>
      <SafetyCertificateOutlined style={{ fontSize: 22, color: "#0f766e" }} />
      <Typography.Text strong style={{ fontSize: 16 }}>
        Temizlik Takip
      </Typography.Text>
    </Flex>
  );
}

// Tüm sayfaların ortak çerçevesi. Giriş yapmayan kişi buradan login ekranına dönüyor.
// Geniş ekranda menü solda sabit. Telefon ve tablette menü içeriği itmesin diye
// üstten açılan bir çekmecede, bir sayfa seçilince kapanıyor.
export function AppLayout({ user, onLogout }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const wide = screens.lg;

  // storage olayı başka sekme veriyi değiştirince çalışıyor. refreshKey artınca sayfalar
  // veriyi yeniden okuyor, yarım doldurulmuş form silinmiyor. Gerçek sistemde bunun
  // yerine WebSocket veya belirli aralıklarla sorgu olurdu.
  useEffect(() => {
    const onStorage = () => setRefreshKey((key) => key + 1);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  const isAdmin = user.role === "admin";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {wide && (
        <Layout.Sider width={240} style={{ borderInlineEnd: line }}>
          <Brand />
          <Menu user={user} />
        </Layout.Sider>
      )}
      {!wide && (
        <Drawer placement="left" open={menuOpen} onClose={() => setMenuOpen(false)} size={260} closable={false} styles={{ body: { padding: 0 } }}>
          <Brand />
          <Menu user={user} onNavigate={() => setMenuOpen(false)} />
        </Drawer>
      )}

      <Layout>
        <Layout.Header style={{ borderBottom: line, padding: wide ? "0 24px" : "0 12px" }}>
          <Flex align="center" gap={wide ? 12 : 8} style={{ height: "100%" }}>
            {!wide && (
              <>
                <Button type="text" icon={<MenuOutlined />} aria-label="Menüyü aç" onClick={() => setMenuOpen(true)} />
                <Typography.Text strong>Temizlik Takip</Typography.Text>
              </>
            )}
            <Flex align="center" gap={wide ? 12 : 8} style={{ marginLeft: "auto" }}>
              <Avatar style={{ background: "#0f766e" }}>{user.name[0]}</Avatar>
              {wide && <Typography.Text>{user.name}</Typography.Text>}
              <Tag color={isAdmin ? "blue" : "green"} style={{ marginInlineEnd: 0 }}>
                {isAdmin ? "Yönetici" : "Operatör"}
              </Tag>
              <Button type="text" icon={<LogoutOutlined />} aria-label="Çıkış" onClick={onLogout}>
                {wide && "Çıkış"}
              </Button>
            </Flex>
          </Flex>
        </Layout.Header>
        <Layout.Content style={{ padding: wide ? 24 : 12 }}>
          <Outlet context={{ refreshKey }} />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
