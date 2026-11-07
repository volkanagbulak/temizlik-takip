// src/api/auditApi.js
import { get } from "./client";

export const getAuditLogApi = () => get("/audit");
