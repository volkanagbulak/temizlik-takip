// src/api/mediaApi.js
import { clearMediaFiles, loadMediaFile, saveMediaFile } from "../fakeBackend/mediaStore";

// Gerçek sistemde POST /media ile dosya yüklenir, dönen adres adıma yazılır.
export const uploadMediaApi = (file) => saveMediaFile(file);
export const getMediaFileApi = (id) => loadMediaFile(id);
export const clearMediaApi = () => clearMediaFiles();
