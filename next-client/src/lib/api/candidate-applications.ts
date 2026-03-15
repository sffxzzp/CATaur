import { request } from "@/lib/request";
import type { Application, PaginatedResponse } from "@/lib/api/types";

export const candidateApplicationsClient = {
  list: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams({
      page: String(params?.page || 1),
      limit: String(params?.limit || 20),
    });
    return request<PaginatedResponse<Application>>(
      `/candidate/applications?${searchParams}`
    );
  },
};
