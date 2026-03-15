import { request } from "./request";
import type { User, PaginatedResponse } from "./types";

export const usersClient = {
  listByRole: (role: string, params?: { page?: number; limit?: number }) =>
    request<PaginatedResponse<User>>(
      `/api/admin/users?${new URLSearchParams({
        page: String(params?.page || 1),
        limit: String(params?.limit || 100),
        role,
      })}`,
      { method: "GET" }
    ),
};
