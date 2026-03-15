import { request } from "./request";
import type { Application, PaginatedResponse } from "./types";

export const applicationsClient = {
  list: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    jobOrderId?: string;
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
    if (params?.jobOrderId) {
      searchParams.jobOrderId = params.jobOrderId;
    }
    return request<PaginatedResponse<Application>>(
      `/api/recruiter/applications?${new URLSearchParams(searchParams)}`,
      { method: "GET" }
    );
  },

  getById: (id: string) =>
    request<Application>(`/api/recruiter/applications/${id}`, { method: "GET" }),

  updateStatus: (id: string, body: {
    status: 'new' | 'interview' | 'offer' | 'closed';
    interviewSubject?: string;
    interviewType?: 'Zoom' | 'Phone' | 'Onsite';
    interviewDate?: string;
    interviewTime?: string;
    interviewContent?: string;
    offerContent?: string;
  }) =>
    request<Application>(`/api/recruiter/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  updateCandidate: (id: string, body: {
    location?: string;
    availability?: string;
    recruiterNotes?: string;
    status?: 'new' | 'interview' | 'offer' | 'closed';
    nickname?: string;
    email?: string;
    phone?: string;
  }) =>
    request<Application>(`/api/recruiter/candidates/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  getResumeUrl: (id: string) =>
    request<{ resumeUrl: string | null }>(`/api/recruiter/candidates/${id}/resume`, {
      method: "GET",
    }),
};
