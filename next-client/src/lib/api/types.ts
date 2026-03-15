export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  role: string;
};

export type User = {
  id: string;
  email: string;
  nickname: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
};

export type JobOrder = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  location: string | null;
  openings: number;
  salary: string | null;
  tags: string[] | null;
  companyId: string | null;
  employmentType: string | null;
  workArrangement: string | null;
  locationCountry: string | null;
  locationState: string | null;
  locationCity: string | null;
  assignedToId: string | null;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobOrder_OLD = {
  id: number;
  recruiter_id: number;
  title: string;
  company?: string | null;
  description: string | null;
  location: string | null;
  salary_min: string | null;
  salary_max: string | null;
  status: string;
  created_at: string;
};

export type Company = {
  id: string;
  name: string;
  email: string;
  contact: string | null;
  phone: string | null;
  website: string | null;
  location: string | null;
  keyTechnologies: string | null;
  clientId: string | null;
  owner: string | null;
  createdAt: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
