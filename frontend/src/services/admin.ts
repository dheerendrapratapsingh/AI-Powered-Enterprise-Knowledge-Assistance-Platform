import { fetchWithAuth, API_URL } from "./api";

export async function uploadDocument(formData: FormData) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/admin/documents/upload`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Upload failed");
  }
  return response.json();
}

export async function getDocuments() {
  return fetchWithAuth("/admin/documents");
}

export async function deleteDocument(id: string) {
  return fetchWithAuth(`/admin/documents/${id}`, {
    method: "DELETE"
  });
}
