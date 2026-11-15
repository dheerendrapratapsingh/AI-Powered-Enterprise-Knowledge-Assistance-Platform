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

export async function reprocessDocument(id: string) {
  return fetchWithAuth(`/admin/documents/${id}/reprocess`, {
    method: "POST"
  });
}

export async function replaceDocument(id: string, formData: FormData) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/admin/documents/${id}/replace`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Replacement failed");
  }
  return response.json();
}

// Crawler APIs
export async function getCrawlConfig() {
  return fetchWithAuth("/admin/crawler/config");
}

export async function saveCrawlConfig(data: any) {
  return fetchWithAuth("/admin/crawler/config", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function startCrawl() {
  return fetchWithAuth("/admin/crawler/start", {
    method: "POST"
  });
}

export async function pauseCrawl(jobId: string) {
  return fetchWithAuth(`/admin/crawler/pause/${jobId}`, {
    method: "POST"
  });
}

export async function resumeCrawl(jobId: string) {
  return fetchWithAuth(`/admin/crawler/resume/${jobId}`, {
    method: "POST"
  });
}

export async function stopCrawl(jobId: string) {
  return fetchWithAuth(`/admin/crawler/stop/${jobId}`, {
    method: "POST"
  });
}

export async function getCrawlJobs() {
  return fetchWithAuth("/admin/crawler/jobs");
}

export async function getCrawlJobLogs(jobId: string) {
  return fetchWithAuth(`/admin/crawler/jobs/${jobId}/logs`);
}

export async function getCrawledPages(params?: { jobId?: string; status?: string; skip?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.jobId) searchParams.append("job_id", params.jobId);
  if (params?.status) searchParams.append("status", params.status);
  if (params?.skip !== undefined) searchParams.append("skip", String(params.skip));
  if (params?.limit !== undefined) searchParams.append("limit", String(params.limit));

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return fetchWithAuth(`/admin/crawler/pages${query}`);
}

export async function getDocumentChunks(documentId: string) {
  return fetchWithAuth(`/admin/documents/${documentId}/chunks`);
}

export async function probeRetrieval(query: string, topK: number = 5) {
  return fetchWithAuth("/admin/documents/probe-retrieval", {
    method: "POST",
    body: JSON.stringify({ query, top_k: topK })
  });
}

export async function getKnowledgeStats() {
  return fetchWithAuth("/admin/documents/knowledge-stats");
}
