// src/api/client.js
import axios from "axios";
import { fakeAdapter } from "../fakeBackend/fakeServer";

// Gerçek backend gelince adapter kalkıp baseURL gelecek, sayfalara dokunmak gerekmeyecek.
export const api = axios.create({ adapter: fakeAdapter });

// Her istekle birlikte işlemi kimin yaptığı da gidiyor.
export function setCurrentUser(userId) {
  api.defaults.headers.common["x-user-id"] = userId;
}
