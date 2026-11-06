// src/api/machineApi.js
import { get, post } from "./client";

// Makineler dolu/boş bilgisiyle geliyor.
export const getMachinesApi = () => get("/machines");
export const addMachineApi = (form) => post("/machines", form);
export const setMachineActiveApi = (id, active) => post(`/machines/${id}/active`, { active });
