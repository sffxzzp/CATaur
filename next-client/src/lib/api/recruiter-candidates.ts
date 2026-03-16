import { request } from "./request";
import type { Application, PaginatedResponse } from "./types";

export type ImportCandidateInput = {
  name: string;
  email: string;
  phone?: string;
  locationCountry?: string;
  locationState?: string;
  locationCity?: string;
};

export const recruiterCandidatesClient = {
  list: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    jobOrderId?: string;
    location?: string;
  }) => {
    const searchParams: Record<string, string> = {
      page: String(params?.page || 1),
      limit: String(params?.limit || 20),
    };
    if (params?.status) searchParams.status = params.status;
    if (params?.search) searchParams.search = params.search;
    if (params?.jobOrderId) searchParams.jobOrderId = params.jobOrderId;
    if (params?.location) searchParams.location = params.location;
    return request<PaginatedResponse<Application>>(
      `/api/recruiter/candidates?${new URLSearchParams(searchParams)}`,
      { method: "GET" }
    );
  },

  getById: (id: string) =>
    request<Application>(`/api/recruiter/candidates/${id}`, { method: "GET" }),

  bulkImport: (body: { jobOrderId: string; candidates: ImportCandidateInput[] }) =>
    request<Application[]>(`/api/recruiter/candidates/import`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    request<void>(`/api/recruiter/candidates/${id}`, { method: "DELETE" }),
};
