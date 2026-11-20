import { fetchWithAuth } from "./api";

export interface PlatformStats {
  total_organizations: number;
  total_users: number;
  total_queries: number;
  total_documents: number;
  system_uptime: string;
}

export interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  status: string;
  user_count: number;
  document_count: number;
  admin_emails?: string[];
  created_at?: string;
}

export interface OrgStats {
  document_count: number;
  active_users: number;
  total_chunks: number;
  system_uptime: string;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  return fetchWithAuth("/platform/stats");
}

export async function getOrganizations(): Promise<OrganizationItem[]> {
  return fetchWithAuth("/platform/organizations");
}

export async function createOrganization(payload: { name: string; domain?: string; admin_emails?: string[] }): Promise<OrganizationItem> {
  return fetchWithAuth("/platform/organizations", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateOrganization(
  orgId: string,
  payload: { 
    name?: string; 
    domain?: string; 
    status?: string; 
    admin_emails?: string[];
    admin_passwords?: Record<string, string>;
  }
): Promise<OrganizationItem> {
  return fetchWithAuth(`/platform/organizations/${orgId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function setOrgAdminPassword(
  orgId: string,
  email: string,
  password: string
): Promise<{ detail: string }> {
  return fetchWithAuth(`/platform/organizations/${orgId}/set-password`, {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function deleteOrganization(orgId: string): Promise<{ detail: string }> {
  return fetchWithAuth(`/platform/organizations/${orgId}`, {
    method: "DELETE"
  });
}

export async function getOrgStats(): Promise<OrgStats> {
  return fetchWithAuth("/org/stats");
}
