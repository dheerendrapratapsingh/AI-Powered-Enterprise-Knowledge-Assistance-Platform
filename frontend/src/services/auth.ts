import { fetchWithAuth, API_URL } from "./api";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  student_id?: string;
}

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

export async function register(data: RegisterData) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role || "STUDENT",
      student_id: data.student_id || null
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Registration failed");
  }

  // Automatically sign in upon successful registration
  return login(data.email, data.password);
}

export async function getCurrentUser() {
  return fetchWithAuth("/auth/me");
}

export function logout() {
  localStorage.removeItem("token");
}
