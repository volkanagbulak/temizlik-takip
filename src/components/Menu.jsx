// src/components/Menu.jsx
import { Menu as AntMenu } from "antd";
import {
  AppstoreOutlined,
  BarChartOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  ProfileOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

// Doküman operatör ile yöneticinin aynı şeyleri görmesini istemiyor, menüler role göre ayrı.
const OPERATOR_MENU = [
  { key: "/", label: "İşlerim", icon: <AppstoreOutlined /> },
  { key: "/records/new", label: "Yeni kayıt", icon: <PlusCircleOutlined /> },
  { key: "/records", label: "Kayıtlar", icon: <FileTextOutlined /> },
];

const ADMIN_MENU = [
  { key: "/control", label: "Kontrol paneli", icon: <DashboardOutlined /> },
  { key: "/records", label: "Kayıtlar", icon: <FileTextOutlined /> },
  { key: "/procedures", label: "Prosedürler", icon: <ProfileOutlined /> },
  { key: "/machines", label: "Makineler", icon: <ToolOutlined /> },
  { key: "/materials", label: "Malzemeler", icon: <ExperimentOutlined /> },
  { key: "/reports", label: "Raporlar", icon: <BarChartOutlined /> },
  { key: "/audit", label: "Denetim izi", icon: <SafetyCertificateOutlined /> },
];

export function Menu({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const items = user.role === "admin" ? ADMIN_MENU : OPERATOR_MENU;
  // Alt sayfada (örn. /procedures/procedure1) üst menü seçili kalsın. En uzun eşleşen anahtar seçiliyor.
  const selected = items
    .map((item) => item.key)
    .filter((key) => location.pathname === key || (key !== "/" && location.pathname.startsWith(`${key}/`)))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <AntMenu
      mode="inline"
      items={items}
      selectedKeys={selected ? [selected] : []}
      onClick={({ key }) => navigate(key)}
      style={{ borderInlineEnd: 0 }}
    />
  );
}
