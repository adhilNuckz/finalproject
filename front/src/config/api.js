// API Configuration
// This will use environment variable in production or fallback to DigitalOcean server in development

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://142.93.220.168:5002';

export const API_BASE = API_BASE_URL;
export const API_URL = API_BASE_URL;
export const SOCKET_URL = API_BASE_URL;

export default API_BASE;
