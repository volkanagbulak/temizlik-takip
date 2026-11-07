// src/api/materialApi.js
import { post } from "./client";

export const addMaterialLotApi = (id, form) => post(`/materials/${id}/lots`, form);
