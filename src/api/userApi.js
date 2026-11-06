// src/api/userApi.js
import { get } from "./client";

export const getUsersApi = () => get("/users");
// Hangi operatörün şu an başka bir adımda çalıştığı.
export const getAvailabilityApi = () => get("/users/availability");
