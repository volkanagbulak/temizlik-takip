// src/api/recordApi.js
import { get, post } from "./client";

export const getRecordsApi = () => get("/records");
export const getRecordDetailApi = (id) => get(`/records/${id}`);
export const openRecordApi = (form) => post("/records", form);
export const cancelRecordApi = (id, reason, detail) => post(`/records/${id}/cancel`, { reason, detail });
