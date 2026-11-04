// src/api/client.js
import axios from "axios";
import { fakeAdapter } from "../fakeBackend/fakeServer";

export const api = axios.create({ adapter: fakeAdapter });

export function setCurrentUser(userId) {
  api.defaults.headers.common["x-user-id"] = userId;
}
