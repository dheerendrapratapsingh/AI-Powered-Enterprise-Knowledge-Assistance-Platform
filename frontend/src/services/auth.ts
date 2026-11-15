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

export async function register(userData: {
  name: string;
  email: string;
  password: string;
  student_id?: string;
  role?: string;
}) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Registration failed");
  }

  // Auto-login after registration
  return login(userData.email, userData.password);
}

export async function getCurrentUser() {
  return fetchWithAuth("/auth/me");
}

export function logout() {
  localStorage.removeItem("token");
}
