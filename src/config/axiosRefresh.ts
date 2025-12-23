import axios from "axios";
import { BACKEND_BASE_URL } from "../constants";


export const refreshApi = axios.create({
  baseURL: BACKEND_BASE_URL + "/api",
  withCredentials: true, 
});
