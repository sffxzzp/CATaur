import { request } from "./request";
import type { Company, PaginatedResponse } from "./types";

export const companiesClient = {
  list: (params?: { page?: number; limit?: number; search?: string }) => {
    const searchParams: Record<string, string> = {
      page: String(params?.page || 1),
      limit: String(params?.limit || 10),
    };
    if (params?.search) {
      searchParams.search = params.search;
    }
    return request<PaginatedResponse<Company>>(
      `/api/recruiter/companies?${new URLSearchParams(searchParams)}`,
      { method: "GET" }
    );
  },
  getById: (id: string) =>
    request<Company>(`/api/recruiter/companies/${id}`, { method: "GET" }),
  create: (body: {
    name: string;
    email: string;
    contact?: string;
    phone?: string;
    website?: string;
    location?: string;
    locationCountry?: string;
    locationState?: string;
    locationCity?: string;
    keyTechnologies?: string;
    clientAccountId?: string;
  }) =>
    request<{ data: Company }>("/api/recruiter/companies", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: {
    name?: string;
    email?: string;
    contact?: string;
    phone?: string;
    website?: string;
    location?: string;
    locationCountry?: string;
    locationState?: string;
    locationCity?: string;
    keyTechnologies?: string;
    clientAccountId?: string;
  }) =>
    request<{ data: Company }>(`/api/recruiter/companies/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/recruiter/companies/${id}`, {
      method: "DELETE",
    }),
};
