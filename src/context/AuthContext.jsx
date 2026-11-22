import { useState } from "react";
import { useEffect } from "react";
import { useCallback } from "react";
import { useContext } from "react";
import { createContext } from "react";
import { api,refreshAccessToken, setAuthFailureHandler, setaccessToken } from "../lib/api.js";
import { socket } from "../lib/socket.js";
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({children}) {
   const [user,setUser]=useState(null);
   const [loading,setloading]=useState(true);

   const loadUser=useCallback(async () => {
    const {data} = await api.get("/auth/me");
    setUser(data.user);
    if(!socket.connected) socket.connect();
   },[]);
   
   const clearsession = useCallback(() =>{
    setaccessToken(null);
    setUser(null);
    socket.disconnect();
   },[]);

   useEffect(() => {
    setAuthFailureHandler(clearsession);
  
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  
    (async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await refreshAccessToken();
          await loadUser();
          break; // success
        } catch (err) {
          const status = err.response?.status;
          if (status === 401 || status === 403) { clearsession(); break; } // really logged out
          if (attempt === 3) { clearsession(); break; }                    // gave up
          await wait(1000 * attempt); 
          console.error("Startup auth failed:", err.response?.status, err.response?.data || err.message);                                     // 429 / network: retry
        }
      }
      setloading(false);
    })();
  }, [loadUser, clearsession]);

   const login = async (email,password) => {
    const {data}=await api.post("/auth/login", {email,password});
    setaccessToken(data.accessToken);
    await loadUser();
   }

   const register = (payload) => api.post("/auth/register",payload);

   const logout = async () => {
    try { await api.post("/auth/logout"); } finally { clearsession(); }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}