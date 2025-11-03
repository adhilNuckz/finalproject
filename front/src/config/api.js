// API Configuration
// This will use environment variable in production or fallback to localhost in development

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_BASE = API_BASE_URL;
export const API_URL = API_BASE_URL;
export const SOCKET_URL = API_BASE_URL;

export default API_BASE;
