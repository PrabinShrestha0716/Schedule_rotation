const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_URL = configuredApiUrl || (typeof window !== "undefined" ? window.location.origin : "http://localhost:4000");

function buildUrl(path) {
  const normalizedBase = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
  return new URL(path.replace(/^\/+/, ""), normalizedBase).toString();
}

async function apiRequest(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || `Request failed with status ${response.status}.`
    );
  }

  return data;
}

export function getStaffMembers() {
  return apiRequest("/api/staff");
}

export function createStaffMember(staffMember) {
  return apiRequest("/api/staff", {
    method: "POST",
    body: JSON.stringify(staffMember),
  });
}

export function updateStaffMember(staffId, staffMember) {
  return apiRequest(`/api/staff/${staffId}`, {
    method: "PUT",
    body: JSON.stringify(staffMember),
  });
}

export function updateStaffStatus(staffId, status) {
  return apiRequest(`/api/staff/${staffId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteStaffMember(staffId) {
  return apiRequest(`/api/staff/${staffId}`, {
    method: "DELETE",
  });
}

export function getWorkTypes() {
  return apiRequest("/api/work-areas");
}

export function createWorkType(workType) {
  return apiRequest("/api/work-areas", { method: "POST", body: JSON.stringify(workType) });
}

export function updateWorkType(id, workType) {
  return apiRequest(`/api/work-areas/${id}`, { method: "PUT", body: JSON.stringify(workType) });
}

export function updateWorkTypeStatus(id, status) {
  return apiRequest(`/api/work-areas/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export function getSchedules() {
  return apiRequest("/api/schedules");
}

export function getSchedule(id) {
  return apiRequest(`/api/schedules/${id}`);
}

export function createSchedule(schedule) {
  return apiRequest("/api/schedules", {
    method: "POST",
    body: JSON.stringify(schedule),
  });
}

export function deleteSavedSchedule(id) {
  return apiRequest(`/api/schedules/${id}`, { method: "DELETE" });
}
