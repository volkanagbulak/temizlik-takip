// src/api/client.js
import axios from "axios";
import { fakeAdapter } from "../fakeBackend/fakeServer";

// Gerçek backend gelince adapter kalkıp baseURL gelecek, sayfalara dokunmak gerekmeyecek.
export const api = axios.create({ adapter: fakeAdapter });

// Her istekte işlemi yapan kişiyi oturumdan okuyup gönderiyorum.
api.interceptors.request.use((config) => {
  const text = sessionStorage.getItem("currentUser");
  if (text) config.headers["x-user-id"] = JSON.parse(text).id;
  return config;
});
