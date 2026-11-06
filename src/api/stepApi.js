// src/api/stepApi.js
import { post } from "./client";

const stepUrl = (id, stepId) => `/records/${id}/steps/${stepId}`;

export const startStepApi = (id, stepId) => post(`${stepUrl(id, stepId)}/start`);
export const finishStepApi = (id, stepId, reason) => post(`${stepUrl(id, stepId)}/finish`, { reason });
export const pauseStepApi = (id, stepId, reason) => post(`${stepUrl(id, stepId)}/pause`, { reason });
export const resumeStepApi = (id, stepId) => post(`${stepUrl(id, stepId)}/resume`);
export const setStepPeopleApi = (id, stepId, userIds) => post(`${stepUrl(id, stepId)}/people`, { userIds });
