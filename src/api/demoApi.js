// src/api/demoApi.js
import { post } from "./client";
import { clearMediaApi } from "./mediaApi";

// Yalnızca demo için: veriyi ve yüklenen dosyaları örnek hâline döndürür. Gerçek sistemde bu uç olmaz.
export const resetDemoApi = () => post("/demo/reset").then(clearMediaApi);
