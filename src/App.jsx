// src/App.jsx
import { useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { AdminRoute } from "./components/AdminRoute";
import { ControlPage } from "./pages/ControlPage";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { NewRecordPage } from "./pages/NewRecordPage";
import { RecordsPage } from "./pages/RecordsPage";
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
        <Route path="/records/:recordId" element={<h1>Kayıt detayı</h1>} />
        <Route path="/records/:recordId/run" element={<RunPage />} />

        <Route element={<AdminRoute user={user} />}>
          <Route path="/control" element={<ControlPage />} />
          <Route path="/procedures" element={<h1>Prosedürler</h1>} />
          <Route path="/machines" element={<h1>Makineler</h1>} />
          <Route path="/materials" element={<h1>Malzemeler</h1>} />
          <Route path="/reports" element={<h1>Raporlar</h1>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
