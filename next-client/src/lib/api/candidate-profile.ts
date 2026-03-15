import { request } from "./request";
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

export const candidateProfileClient = {
  // Get full candidate profile with all related data
  getProfile: (candidateId: string) =>
    request<CandidateProfileExtended>(
      `/api/recruiter/candidates/${candidateId}/profile`,
      { method: "GET" }
    ),

  // Update basic candidate profile info
  updateProfile: (candidateId: string, body: UpdateCandidateProfileDto) =>
    request<CandidateProfileExtended>(
      `/api/recruiter/candidates/${candidateId}/profile`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      }
    ),

  // Skills management
  addSkill: (candidateId: string, body: CreateSkillDto) =>
    request<CandidateSkill>(
      `/api/recruiter/candidates/${candidateId}/skills`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    ),

  updateSkill: (candidateId: string, skillId: string, body: CreateSkillDto) =>
    request<CandidateSkill>(
      `/api/recruiter/candidates/${candidateId}/skills/${skillId}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      }
    ),

  deleteSkill: (candidateId: string, skillId: string) =>
    request<void>(
      `/api/recruiter/candidates/${candidateId}/skills/${skillId}`,
      { method: "DELETE" }
    ),

  // Work experience management
  addWorkExperience: (candidateId: string, body: CreateWorkExperienceDto) =>
    request<CandidateWorkExperience>(
      `/api/recruiter/candidates/${candidateId}/work-experience`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    ),

  updateWorkExperience: (
    candidateId: string,
    experienceId: string,
    body: CreateWorkExperienceDto
  ) =>
    request<CandidateWorkExperience>(
      `/api/recruiter/candidates/${candidateId}/work-experience/${experienceId}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      }
    ),

  deleteWorkExperience: (candidateId: string, experienceId: string) =>
    request<void>(
      `/api/recruiter/candidates/${candidateId}/work-experience/${experienceId}`,
      { method: "DELETE" }
    ),

  // Education management
  addEducation: (candidateId: string, body: CreateEducationDto) =>
    request<CandidateEducation>(
      `/api/recruiter/candidates/${candidateId}/education`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    ),

  updateEducation: (
    candidateId: string,
    educationId: string,
    body: CreateEducationDto
  ) =>
    request<CandidateEducation>(
      `/api/recruiter/candidates/${candidateId}/education/${educationId}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      }
    ),

  deleteEducation: (candidateId: string, educationId: string) =>
    request<void>(
      `/api/recruiter/candidates/${candidateId}/education/${educationId}`,
      { method: "DELETE" }
    ),
};
