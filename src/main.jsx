// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App as AntApp, ConfigProvider } from "antd";
import trTR from "antd/locale/tr_TR";
import "antd/dist/reset.css";
import App from "./App.jsx";
// Görünüm ayarları tek yerde. Ayrı CSS yazmadan Ant Design üzerinden yönetiyorum.
const theme = {
  token: {
    colorPrimary: "#0f766e",
    borderRadius: 8,
  },
  components: {
    Layout: {
      bodyBg: "#f6f8f9",
      headerBg: "#ffffff",
      siderBg: "#ffffff",
      headerPadding: "0 24px",
    },
    Menu: {
      itemBorderRadius: 8,
      itemSelectedBg: "#e6f4f1",
      itemSelectedColor: "#0f766e",
      itemMarginInline: 12,
    },
  },
};
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ConfigProvider locale={trTR} theme={theme}>
      <AntApp>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
);
