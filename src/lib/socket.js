import { io } from "socket.io-client";
import { getaccessToken } from "./api.js";

export const socket =io(import.meta.env.VITE_API_URL,{
  autoConnect:false,
  auth:(cb)=>cb({ token:getaccessToken()}),
});