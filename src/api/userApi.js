// src/api/userApi.js
import { get, post } from "./client";

export const getUsersApi = () => get("/users");
// Hangi operatörün şu an başka bir adımda çalıştığı.
export const getAvailabilityApi = () => get("/users/availability");
export const addUserApi = (form) => post("/users", form);
export const setUserActiveApi = (id, active) => post(`/users/${id}/active`, { active });
