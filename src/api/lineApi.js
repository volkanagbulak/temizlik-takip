// src/api/lineApi.js
import { post } from "./client";

export const addFacilityApi = (form) => post("/facilities", form);
export const addLineApi = (form) => post("/lines", form);
