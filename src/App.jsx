// src/App.jsx
import { useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { setCurrentUser } from "./api/client";
import { AppLayout } from "./components/AppLayout";
import { AdminRoute } from "./components/AdminRoute";
import { LoginPage } from "./pages/LoginPage";

const SESSION_KEY = "currentUser";

function loadSessionUser() {
  const text = sessionStorage.getItem(SESSION_KEY);
  if (!text) return null;
  const user = JSON.parse(text);
  setCurrentUser(user.id); // yenilemeden sonra axios kullanıcıyı tekrar bilsin
  return user;
}

const homePath = (user) => (user.role === "admin" ? "/control" : "/");

export default function App() {
  const [user, setUser] = useState(loadSessionUser);
  const navigate = useNavigate();

  function handleLogin(selected) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(selected));
    setCurrentUser(selected.id);
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
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={homePath(user)} replace />
          ) : (
            <LoginPage onLogin={handleLogin} />
          )
        }
      />

      <Route element={<AppLayout user={user} onLogout={handleLogout} />}>
        <Route path="/" element={<h1>İşlerim</h1>} />
        <Route path="/records" element={<h1>Kayıtlar</h1>} />
        <Route path="/records/new" element={<h1>Yeni kayıt</h1>} />
        <Route path="/records/:recordId" element={<h1>Kayıt detayı</h1>} />
        <Route
          path="/records/:recordId/run"
          element={<h1>Temizlik ekranı</h1>}
        />

        <Route element={<AdminRoute user={user} />}>
          <Route path="/control" element={<h1>Kontrol paneli</h1>} />
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
