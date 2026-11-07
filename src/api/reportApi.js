// src/api/reportApi.js
import { get } from "./client";

// Hesaplama serviste yapılıyor, ekran yalnızca sonucu gösteriyor.
export const getReportApi = () => get("/reports");
