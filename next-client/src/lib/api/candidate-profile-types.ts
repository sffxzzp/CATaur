// Extended candidate profile types for detailed view

export type SkillLevel = 'Expert' | 'Intermediate' | 'Beginner';

export interface CandidateSkill {
  id: string;
  candidateId: string;
  skillName: string;
  skillLevel: SkillLevel;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateWorkExperience {
  id: string;
  candidateId: string;
  role: string;
  company: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  highlights: string | null; // JSON string array
  createdAt: string;
  updatedAt: string;
}

export interface CandidateEducation {
  id: string;
  candidateId: string;
  school: string;
  degree: string;
  fieldOfStudy: string | null;
  graduationYear: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateProfileExtended {
  // Basic info from user table
  id: string;
  email: string;
  nickname: string;
  phone: string | null;

  // Extended info from candidate table
  summary: string | null;
  yearsOfExperience: number | null;
  targetSalary: string | null;
  preferredLocation: string | null;
  linkedin: string | null;
  resumeUrl: string | null;
  portfolioUrl: string | null;
  currentLocation: string | null;
  noticePeriod: number | null;
  availableDate: string | null;
  profileStatus: string | null;

  // Related data
  skills: CandidateSkill[];
  workExperience: CandidateWorkExperience[];
  education: CandidateEducation[];
}

// DTOs for API requests
export interface UpdateCandidateProfileDto {
  summary?: string;
  yearsOfExperience?: number;
  targetSalary?: string;
  preferredLocation?: string;
  linkedin?: string;
  phone?: string;
  currentLocation?: string;
  noticePeriod?: number;
  availableDate?: string;
}

export interface CreateSkillDto {
  skillName: string;
  skillLevel: SkillLevel;
}

export interface CreateWorkExperienceDto {
  role: string;
  company: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  highlights?: string[]; // Will be JSON stringified
}

export interface CreateEducationDto {
  school: string;
  degree: string;
  fieldOfStudy?: string;
  graduationYear?: number;
}
