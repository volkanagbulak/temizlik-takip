// src/api/procedureApi.js
import { post } from "./client";

export const createProcedureApi = (form) => post("/procedures", form);
// baseVersion: düzenlemeye başlarken görülen versiyon. Arada değiştiyse servis 409 döner.
export const createProcedureVersionApi = (id, form) => post(`/procedures/${id}/versions`, form);
export const setProcedureMachinesApi = (id, machineIds) => post(`/procedures/${id}/machines`, { machineIds });
