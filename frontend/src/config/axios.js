import axios from 'axios';


const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})

// Attach latest token on every request
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers = config.headers || {};
        config.headers[ "Authorization" ] = `Bearer ${token}`;
    } else if (config.headers && config.headers[ "Authorization" ]) {
        delete config.headers[ "Authorization" ];
    }
    return config;
});


export default axiosInstance;   