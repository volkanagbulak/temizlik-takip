// src/components/AdminRoute.jsx
import { Result } from "antd";
import { Outlet, useOutletContext } from "react-router-dom";

// Bu yalnızca ekran kolaylığı. Asıl yetki kontrolü servis tarafında olacak.
export function AdminRoute({ user }) {
  // AppLayout'tan gelen refreshKey alttaki sayfalara da ulaşsın.
  const context = useOutletContext();

  if (user?.role !== "admin") {
    return <Result status="403" title="Bu sayfa yönetici yetkisi ister." />;
  }
  return <Outlet context={context} />;
}
