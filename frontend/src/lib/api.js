const BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

const redirectToLogin = () => {
  window.location.href = "/login";
};

const refreshAccessToken = async () => {
  const res = await fetch(`${BASE_URL}/users/refresh-token`, {
    method: "POST",
    credentials: "include",
  });
  return res.ok;
};

const parseResponse = async (res) => {
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = json?.message || res.statusText || "Request failed";
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return json?.data ?? json;
};

const request = async (path, options = {}, retry = false, redirectOnUnauthorized = true) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    ...options,
  });

  if (response.status === 401 && !retry) {
    if (redirectOnUnauthorized) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return request(path, options, true, redirectOnUnauthorized);
      }
      redirectToLogin();
    }
    throw new Error("Unauthorized");
  }

  return parseResponse(response);
};

const jsonRequest = async (method, path, body, redirectOnUnauthorized = true) => {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
  return request(path, options, false, redirectOnUnauthorized);
};

export const api = {
  get: (path, redirectOnUnauthorized = true) => request(path, { method: "GET" }, false, redirectOnUnauthorized),
  post: (path, body, redirectOnUnauthorized = true) => jsonRequest("POST", path, body, redirectOnUnauthorized),
  put: (path, body, redirectOnUnauthorized = true) => jsonRequest("PUT", path, body, redirectOnUnauthorized),
  delete: (path, redirectOnUnauthorized = true) => request(path, { method: "DELETE" }, false, redirectOnUnauthorized),
  postForm: (path, formData, redirectOnUnauthorized = true) =>
    request(path, {
      method: "POST",
      body: formData,
    }, false, redirectOnUnauthorized),
};

export default api;
