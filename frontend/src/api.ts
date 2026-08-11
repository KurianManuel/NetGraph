const API_BASE = "/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // Always include credentials to send/receive HTTP-only cookies
  options.credentials = "include";
  options.headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, options);

  if (response.status === 204) {
    return null;
  }

  let data;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage = data?.detail || data?.message || "An unexpected error occurred.";
    throw new ApiError(errorMessage, response.status);
  }

  return data;
}

export const api = {
  // Auth API
  async setupAdmin(username: string, password: string) {
    return apiFetch("/auth/setup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  async login(username: string, password: string) {
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  async logout() {
    return apiFetch("/auth/logout", {
      method: "POST",
    });
  },

  async getMe() {
    return apiFetch("/auth/me");
  },

  // Devices API
  async getDevices() {
    return apiFetch("/devices");
  },

  async getDeviceDetails(id: number) {
    return apiFetch(`/devices/${id}`);
  },

  // Scans API
  async triggerScan(subnet?: string) {
    return apiFetch("/scans/trigger", {
      method: "POST",
      body: JSON.stringify({ subnet: subnet || null }),
    });
  },

  async getScans() {
    return apiFetch("/scans");
  },

  // Audit Logs API
  async getAuditLogs() {
    return apiFetch("/audit-logs");
  },
};
