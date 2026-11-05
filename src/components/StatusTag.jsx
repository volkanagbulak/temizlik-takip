// src/components/StatusTag.jsx
import { Tag } from "antd";

// Kayıt durumu her sayfada aynı görünsün diye etiketleri tek yerde tutuyorum.
const STATUS = {
  opened: { color: "gold", label: "Açıldı" },
  in_progress: { color: "blue", label: "Devam ediyor" },
  completed: { color: "green", label: "Tamamlandı" },
  cancelled: { color: "default", label: "Kapatıldı" },
};

export function StatusTag({ status }) {
  const { color, label } = STATUS[status];
  return <Tag color={color}>{label}</Tag>;
}
