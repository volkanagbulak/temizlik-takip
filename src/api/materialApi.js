// src/api/materialApi.js
import { post } from "./client";

export const addMaterialApi = (form) => post("/materials", form);
export const addMaterialLotApi = (id, form) => post(`/materials/${id}/lots`, form);
