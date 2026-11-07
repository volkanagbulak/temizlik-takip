// src/App.jsx
import { useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { AdminRoute } from "./components/AdminRoute";
import { AuditPage } from "./pages/AuditPage";
import { ControlPage } from "./pages/ControlPage";
import { LoginPage } from "./pages/LoginPage";
import { MachinesPage } from "./pages/MachinesPage";
import { MaterialsPage } from "./pages/MaterialsPage";
import { HomePage } from "./pages/HomePage";
import { NewProcedurePage } from "./pages/NewProcedurePage";
import { NewRecordPage } from "./pages/NewRecordPage";
import { ProcedureDetailPage } from "./pages/ProcedureDetailPage";
import { ProceduresPage } from "./pages/ProceduresPage";
import { RecordDetailPage } from "./pages/RecordDetailPage";
import { RecordsPage } from "./pages/RecordsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { RunPage } from "./pages/RunPage";

const SESSION_KEY = "currentUser";

// Oturum sessionStorage içinde: sayfa yenilense de kalıyor, her sekme ayrı kullanıcı olabiliyor.
// Aynı anda işlem yapan iki kişiyi iki sekmeyle bu sayede gösterebilirim.
function loadSessionUser() {
  const text = sessionStorage.getItem(SESSION_KEY);
  return text ? JSON.parse(text) : null;
}

// Operatör ve yönetici aynı ekranla başlamasın.
const homePath = (user) => (user.role === "admin" ? "/control" : "/");

export default function App() {
  const [user, setUser] = useState(loadSessionUser);
  const navigate = useNavigate();

  function handleLogin(selected) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(selected));
    setUser(selected);
    navigate(homePath(selected));
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
    navigate("/login");
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={homePath(user)} replace /> : <LoginPage onLogin={handleLogin} />} />

      <Route element={<AppLayout user={user} onLogout={handleLogout} />}>
        <Route path="/" element={<HomePage user={user} />} />
        <Route path="/records" element={<RecordsPage user={user} />} />
        <Route path="/records/new" element={<NewRecordPage user={user} />} />
        <Route path="/records/:recordId" element={<RecordDetailPage />} />
        <Route path="/records/:recordId/run" element={<RunPage />} />

        <Route element={<AdminRoute user={user} />}>
          <Route path="/control" element={<ControlPage />} />
          <Route path="/procedures" element={<ProceduresPage />} />
          <Route path="/procedures/new" element={<NewProcedurePage />} />
          <Route path="/procedures/:procedureId" element={<ProcedureDetailPage />} />
          <Route path="/machines" element={<MachinesPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/audit" element={<AuditPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
