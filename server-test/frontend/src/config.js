// API Configuration for Server Test Environment
// Change these URLs based on your deployment environment

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://142.93.220.168:5002';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://142.93.220.168:5002';
export const TERMINAL_URL = import.meta.env.VITE_TERMINAL_URL || 'http://142.93.220.168:3002';

export default {
  API_BASE_URL,
  SOCKET_URL,
  TERMINAL_URL,
};
