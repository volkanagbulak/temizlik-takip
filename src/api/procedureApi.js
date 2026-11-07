// src/api/procedureApi.js
import { post } from "./client";

// baseVersion: düzenlemeye başlarken görülen versiyon. Arada değiştiyse servis 409 döner.
export const createProcedureVersionApi = (id, form) => post(`/procedures/${id}/versions`, form);
