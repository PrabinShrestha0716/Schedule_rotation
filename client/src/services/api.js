const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
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
