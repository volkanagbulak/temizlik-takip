// src/api/cleaningApi.js
import { api } from "./client";

// Sayfalar servise yalnızca bu dosyadan ulaşıyor, adresler tek yerde duruyor.
const get = (url) => api.get(url).then((res) => res.data);
const post = (url, body) => api.post(url, body).then((res) => res.data);

export const getUsersApi = () => get("/users");
export const getDefinitionsApi = () => get("/definitions");
export const addMachineApi = (form) => post("/machines", form);
export const setMachineActiveApi = (id, active) =>
  post(`/machines/${id}/active`, { active });

export const getRecordsApi = () => get("/records");
export const getRecordDetailApi = (id) => get(`/records/${id}`);
export const openRecordApi = (form) => post("/records", form);
