import { request } from "@/lib/request";
import type {
  CandidateProfileExtended,
  UpdateCandidateProfileDto,
  CreateSkillDto,
  CandidateSkill,
  CreateWorkExperienceDto,
  CandidateWorkExperience,
  CreateEducationDto,
  CandidateEducation,
} from "./candidate-profile-types";

export const candidateSelfProfileClient = {
  getMyProfile: () =>
    request<CandidateProfileExtended>("/candidate/my-profile"),

  updateMyProfile: (body: UpdateCandidateProfileDto) =>
    request<CandidateProfileExtended>("/candidate/my-profile", {
      method: "PUT",
      json: body,
    }),

  // Skills
  addSkill: (body: CreateSkillDto) =>
    request<CandidateSkill>("/candidate/my-profile/skills", {
      method: "POST",
      json: body,
    }),

  updateSkill: (skillId: string, body: CreateSkillDto) =>
    request<CandidateSkill>(`/candidate/my-profile/skills/${skillId}`, {
      method: "PUT",
      json: body,
    }),

  deleteSkill: (skillId: string) =>
    request<void>(`/candidate/my-profile/skills/${skillId}`, {
      method: "DELETE",
    }),

  // Work Experience
  addWorkExperience: (body: CreateWorkExperienceDto) =>
    request<CandidateWorkExperience>("/candidate/my-profile/work-experience", {
      method: "POST",
      json: body,
    }),

  updateWorkExperience: (experienceId: string, body: CreateWorkExperienceDto) =>
    request<CandidateWorkExperience>(
      `/candidate/my-profile/work-experience/${experienceId}`,
      { method: "PUT", json: body }
    ),

  deleteWorkExperience: (experienceId: string) =>
    request<void>(`/candidate/my-profile/work-experience/${experienceId}`, {
      method: "DELETE",
    }),

  // Education
  addEducation: (body: CreateEducationDto) =>
    request<CandidateEducation>("/candidate/my-profile/education", {
      method: "POST",
      json: body,
    }),

  updateEducation: (educationId: string, body: CreateEducationDto) =>
    request<CandidateEducation>(
      `/candidate/my-profile/education/${educationId}`,
      { method: "PUT", json: body }
    ),

  deleteEducation: (educationId: string) =>
    request<void>(`/candidate/my-profile/education/${educationId}`, {
      method: "DELETE",
    }),
};
