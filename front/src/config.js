// Load from environment variables (Vite exposes env vars with VITE_ prefix)
// Defaults derive from the current hostname so the panel works via LAN/public IP too.
const DEFAULT_HOSTNAME =
	typeof window !== 'undefined' && window.location?.hostname
		? window.location.hostname
		: 'localhost';

export const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${DEFAULT_HOSTNAME}:5000`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `http://${DEFAULT_HOSTNAME}:5000`;
export const TERMINAL_URL = import.meta.env.VITE_TERMINAL_URL || `http://${DEFAULT_HOSTNAME}:3000`;
