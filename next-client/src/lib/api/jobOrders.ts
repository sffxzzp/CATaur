import { request } from "./request";
import type { JobOrder, PaginatedResponse } from "./types";

export const jobOrdersClient = {
  list: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    companyId?: string;
    employmentType?: string;
    workArrangement?: string;
    locationCountry?: string;
    locationState?: string;
    locationCity?: string;
    sortBy?: 'recent' | 'openings';
  }) => {
    const searchParams: Record<string, string> = {
      page: String(params?.page || 1),
      limit: String(params?.limit || 20),
    };
    if (params?.status) {
      searchParams.status = params.status;
    }
    if (params?.search) {
      searchParams.search = params.search;
    }
    if (params?.companyId) {
      searchParams.companyId = params.companyId;
    }
    if (params?.employmentType) {
      searchParams.employmentType = params.employmentType;
    }
    if (params?.workArrangement) {
      searchParams.workArrangement = params.workArrangement;
    }
    if (params?.locationCountry) {
      searchParams.locationCountry = params.locationCountry;
    }
    if (params?.locationState) {
      searchParams.locationState = params.locationState;
    }
    if (params?.locationCity) {
      searchParams.locationCity = params.locationCity;
    }
    if (params?.sortBy) {
      searchParams.sortBy = params.sortBy;
    }
    return request<PaginatedResponse<JobOrder>>(
      `/api/recruiter/job-orders?${new URLSearchParams(searchParams)}`,
      { method: "GET" }
    );
  },
  getById: (id: string) =>
    request<JobOrder>(`/api/recruiter/job-orders/${id}`, { method: "GET" }),
  create: (body: {
    title: string;
    description?: string;
    priority?: string;
    location?: string;
    openings?: number;
    salary?: string;
    tags?: string[];
    companyId?: string;
    employmentType?: string;
    workArrangement?: string;
    locationCountry?: string;
    locationState?: string;
    locationCity?: string;
  }) =>
    request<{ data: JobOrder }>("/api/recruiter/job-orders", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    location?: string;
    openings?: number;
    salary?: string;
    tags?: string[];
    companyId?: string;
    employmentType?: string;
    workArrangement?: string;
    locationCountry?: string;
    locationState?: string;
    locationCity?: string;
  }) =>
    request<{ data: JobOrder }>(`/api/recruiter/job-orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/recruiter/job-orders/${id}`, {
      method: "DELETE",
    }),
};
