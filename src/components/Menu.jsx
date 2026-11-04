// src/components/Menu.jsx: import satırları ve bileşen
import { Button, Flex, Menu as AntMenu } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
const OPERATOR_MENU = [
  { path: "/", label: "İşlerim" },
  { path: "/records/new", label: "Yeni kayıt" },
  { path: "/records", label: "Kayıtlar" },
];
const ADMIN_MENU = [
  { path: "/control", label: "Kontrol paneli" },
  { path: "/records", label: "Kayıtlar" },
  { path: "/procedures", label: "Prosedürler" },
  { path: "/machines", label: "Makineler" },
  { path: "/materials", label: "Malzemeler" },
  { path: "/reports", label: "Raporlar" },
];
export function Menu({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const menu = user.role === "admin" ? ADMIN_MENU : OPERATOR_MENU;
  const items = menu.map((item) => ({ key: item.path, label: item.label }));

  return (
    <Flex align="center" gap={8}>
      <AntMenu
        theme="dark"
        mode="horizontal"
        items={items}
        selectedKeys={[location.pathname]}
        onClick={({ key }) => navigate(key)}
        style={{ flex: 1, minWidth: 0 }}
      />
      <Button onClick={onLogout}>Çıkış</Button>
    </Flex>
  );
}
