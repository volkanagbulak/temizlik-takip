// src/api/definitionApi.js
import { get } from "./client";

export const getDefinitionsApi = () => get("/definitions");
