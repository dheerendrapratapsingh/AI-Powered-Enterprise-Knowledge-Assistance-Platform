import { fetchWithAuth, API_URL } from "./api";

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Login failed");
  }

  const data = await response.json();
  localStorage.setItem("token", data.access_token);
  return data;
}

export async function getCurrentUser() {
  return fetchWithAuth("/auth/me");
}

export function logout() {
  localStorage.removeItem("token");
}
