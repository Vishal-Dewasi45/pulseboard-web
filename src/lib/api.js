import axios from "axios";

let accessToken = null;
let onAuthFailure=()=>{};

export const setaccessToken = (t) => {accessToken=t;};
export const getaccessToken = () =>accessToken;
export const setAuthFailureHandler = (fn) => {onAuthFailure=fn;};

export const api= axios.create({
    baseURL:import.meta.env.VITE_API_URL,
    withCredentials:true,
});

api.interceptors.request.use((config)=>{
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
});

let refreshPromise = null;

export const refreshAccessToken=()=>{
    if(!refreshPromise){
        refreshPromise=axios
        .post(`${import.meta.env.VITE_API_URL}/auth/refresh`,null,{withCredentials:true})
        .then((res) => {
          const token = res.data.accessToken;
          if (!token) throw new Error("Refresh response had no accessToken");
          accessToken = token;
          return accessToken;
        })
        .finally(()=>{refreshPromise=null;});
    }
    return refreshPromise;
}

api.interceptors.response.use(
    (res) => res,
    async(error)=>{
        const original=error.config;
        const status=error.response?.status;
        const isAuthRoute=original?.url?.startsWith("/auth/");

        if(status == 401 && !original._retry && !isAuthRoute){
            original._retry = true;
            try {
              await refreshAccessToken();
              original.headers.Authorization = `Bearer ${accessToken}`;
              return api(original);
            } catch {
              setaccessToken(null);
              onAuthFailure();
            }
          }
          return Promise.reject(error);
        }
)

export const getErrorMessage = (err) =>
  err.response?.data?.message || err.message || "Something went wrong";
