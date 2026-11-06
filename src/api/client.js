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

// Alan dosyaları bu iki yardımcıyı kullanıyor, cevaptan yalnızca veri dönüyor.
export const get = (url) => api.get(url).then((res) => res.data);
export const post = (url, body) => api.post(url, body).then((res) => res.data);
