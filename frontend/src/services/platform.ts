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

export async function createOrganization(payload: { name: string; domain?: string }): Promise<OrganizationItem> {
  return fetchWithAuth("/platform/organizations", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getOrgStats(): Promise<OrgStats> {
  return fetchWithAuth("/org/stats");
}
