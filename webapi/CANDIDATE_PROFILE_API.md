# Candidate Profile API 接口文档

## 概述

为了支持候选人详情页面的完整展示,需要实现以下API接口来管理候选人的详细信息,包括:
- 基本信息扩展(summary, yearsOfExperience, targetSalary等)
- 技能列表(Skills)
- 工作经历(Work Experience)
- 教育背景(Education)

## 数据库表结构

### 1. 扩展 `candidate` 表

```sql
ALTER TABLE candidate ADD COLUMN summary TEXT;
ALTER TABLE candidate ADD COLUMN yearsOfExperience INT;
ALTER TABLE candidate ADD COLUMN targetSalary VARCHAR(100);
ALTER TABLE candidate ADD COLUMN preferredLocation VARCHAR(200);
ALTER TABLE candidate ADD COLUMN linkedin VARCHAR(500);
ALTER TABLE candidate ADD COLUMN phone VARCHAR(50);
```

### 2. 新建 `candidate_skill` 表

```sql
CREATE TABLE candidate_skill (
  id CHAR(26) PRIMARY KEY,
  candidateId CHAR(26) NOT NULL,
  skillName VARCHAR(100) NOT NULL,
  skillLevel ENUM('Expert', 'Intermediate', 'Beginner') NOT NULL,
  createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  FOREIGN KEY (candidateId) REFERENCES user(id) ON DELETE CASCADE,
  INDEX idx_candidate_skill (candidateId)
);
```

### 3. 新建 `candidate_work_experience` 表

```sql
CREATE TABLE candidate_work_experience (
  id CHAR(26) PRIMARY KEY,
  candidateId CHAR(26) NOT NULL,
  role VARCHAR(200) NOT NULL,
  company VARCHAR(200) NOT NULL,
  startDate DATE,
  endDate DATE,
  isCurrent BOOLEAN DEFAULT FALSE,
  highlights TEXT,  -- JSON string array
  createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  FOREIGN KEY (candidateId) REFERENCES user(id) ON DELETE CASCADE,
  INDEX idx_candidate_work (candidateId)
);
```

### 4. 新建 `candidate_education` 表

```sql
CREATE TABLE candidate_education (
  id CHAR(26) PRIMARY KEY,
  candidateId CHAR(26) NOT NULL,
  school VARCHAR(200) NOT NULL,
  degree VARCHAR(200) NOT NULL,
  fieldOfStudy VARCHAR(200),
  graduationYear INT,
  createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  FOREIGN KEY (candidateId) REFERENCES user(id) ON DELETE CASCADE,
  INDEX idx_candidate_education (candidateId)
);
```

## API 接口

### 1. 获取候选人完整档案

**GET** `/api/recruiter/candidates/:candidateId/profile`

获取候选人的完整信息,包括基本信息、技能、工作经历、教育背景。

**Response:**
```json
{
  "id": "01HXXX",
  "email": "candidate@example.com",
  "nickname": "John Doe",
  "phone": "+1-416-555-0123",
  "summary": "Seasoned engineer with 8+ years building high-throughput distributed systems...",
  "yearsOfExperience": 8,
  "targetSalary": "CA$140k – CA$160k",
  "preferredLocation": "Toronto, ON (Hybrid)",
  "linkedin": "https://linkedin.com/in/johndoe",
  "resumeUrl": "https://...",
  "portfolioUrl": "https://...",
  "currentLocation": "Toronto, ON",
  "noticePeriod": 30,
  "availableDate": "2026-04-15",
  "profileStatus": "active",
  "skills": [
    {
      "id": "01HYYY",
      "candidateId": "01HXXX",
      "skillName": "Go",
      "skillLevel": "Expert",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z"
    }
  ],
  "workExperience": [
    {
      "id": "01HZZZ",
      "candidateId": "01HXXX",
      "role": "Senior Backend Engineer",
      "company": "Shopify",
      "startDate": "2020-03-01",
      "endDate": null,
      "isCurrent": true,
      "highlights": "[\"Led migration to microservices\", \"Reduced API latency by 40%\"]",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z"
    }
  ],
  "education": [
    {
      "id": "01HAAA",
      "candidateId": "01HXXX",
      "school": "University of Toronto",
      "degree": "B.Sc. Computer Science",
      "fieldOfStudy": "Computer Science",
      "graduationYear": 2016,
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

### 2. 更新候选人基本信息

**PUT** `/api/recruiter/candidates/:candidateId/profile`

更新候选人的基本信息(summary, yearsOfExperience等)。

**Request Body:**
```json
{
  "summary": "Updated summary...",
  "yearsOfExperience": 9,
  "targetSalary": "CA$150k – CA$170k",
  "preferredLocation": "Remote · Canada",
  "linkedin": "https://linkedin.com/in/johndoe",
  "phone": "+1-416-555-0123",
  "currentLocation": "Toronto, ON",
  "noticePeriod": 30,
  "availableDate": "2026-05-01"
}
```

**Response:** 返回更新后的完整档案(同GET接口)

### 3. 技能管理

#### 3.1 添加技能

**POST** `/api/recruiter/candidates/:candidateId/skills`

**Request Body:**
```json
{
  "skillName": "Kubernetes",
  "skillLevel": "Intermediate"
}
```

**Response:**
```json
{
  "id": "01HBBB",
  "candidateId": "01HXXX",
  "skillName": "Kubernetes",
  "skillLevel": "Intermediate",
  "createdAt": "2026-03-15T10:00:00Z",
  "updatedAt": "2026-03-15T10:00:00Z"
}
```

#### 3.2 更新技能

**PUT** `/api/recruiter/candidates/:candidateId/skills/:skillId`

**Request Body:**
```json
{
  "skillName": "Kubernetes",
  "skillLevel": "Expert"
}
```

**Response:** 返回更新后的技能对象

#### 3.3 删除技能

**DELETE** `/api/recruiter/candidates/:candidateId/skills/:skillId`

**Response:** 204 No Content

### 4. 工作经历管理

#### 4.1 添加工作经历

**POST** `/api/recruiter/candidates/:candidateId/work-experience`

**Request Body:**
```json
{
  "role": "Senior Backend Engineer",
  "company": "Shopify",
  "startDate": "2020-03-01",
  "endDate": null,
  "isCurrent": true,
  "highlights": [
    "Led migration to microservices architecture",
    "Reduced API latency by 40%",
    "Mentored 3 junior engineers"
  ]
}
```

**注意:** `highlights` 在数据库中存储为JSON字符串,后端需要进行序列化/反序列化。

**Response:**
```json
{
  "id": "01HCCC",
  "candidateId": "01HXXX",
  "role": "Senior Backend Engineer",
  "company": "Shopify",
  "startDate": "2020-03-01",
  "endDate": null,
  "isCurrent": true,
  "highlights": "[\"Led migration to microservices architecture\",\"Reduced API latency by 40%\",\"Mentored 3 junior engineers\"]",
  "createdAt": "2026-03-15T10:00:00Z",
  "updatedAt": "2026-03-15T10:00:00Z"
}
```

#### 4.2 更新工作经历

**PUT** `/api/recruiter/candidates/:candidateId/work-experience/:experienceId`

**Request Body:** 同添加接口

**Response:** 返回更新后的工作经历对象

#### 4.3 删除工作经历

**DELETE** `/api/recruiter/candidates/:candidateId/work-experience/:experienceId`

**Response:** 204 No Content

### 5. 教育背景管理

#### 5.1 添加教育背景

**POST** `/api/recruiter/candidates/:candidateId/education`

**Request Body:**
```json
{
  "school": "University of Toronto",
  "degree": "B.Sc. Computer Science",
  "fieldOfStudy": "Computer Science",
  "graduationYear": 2016
}
```

**Response:**
```json
{
  "id": "01HDDD",
  "candidateId": "01HXXX",
  "school": "University of Toronto",
  "degree": "B.Sc. Computer Science",
  "fieldOfStudy": "Computer Science",
  "graduationYear": 2016,
  "createdAt": "2026-03-15T10:00:00Z",
  "updatedAt": "2026-03-15T10:00:00Z"
}
```

#### 5.2 更新教育背景

**PUT** `/api/recruiter/candidates/:candidateId/education/:educationId`

**Request Body:** 同添加接口

**Response:** 返回更新后的教育背景对象

#### 5.3 删除教育背景

**DELETE** `/api/recruiter/candidates/:candidateId/education/:educationId`

**Response:** 204 No Content

## 实现注意事项

### 1. Entity 定义

需要创建以下TypeORM实体:
- `CandidateSkill` (src/database/entities/candidate-skill.entity.ts)
- `CandidateWorkExperience` (src/database/entities/candidate-work-experience.entity.ts)
- `CandidateEducation` (src/database/entities/candidate-education.entity.ts)

并更新 `Candidate` 实体,添加新字段。

### 2. DTO 定义

在 `src/recruiter/dto/` 目录下创建:
- `update-candidate-profile.dto.ts`
- `create-skill.dto.ts`
- `create-work-experience.dto.ts`
- `create-education.dto.ts`

### 3. Service 层

在 `RecruiterService` 或创建新的 `CandidateProfileService` 实现业务逻辑:
- 验证候选人归属(确保recruiter只能访问自己的候选人)
- 处理JSON序列化(work experience highlights)
- 实现级联查询(获取完整档案时需要join所有关联表)

### 4. Controller 层

在 `RecruiterController` 中添加新的路由处理器,或创建新的 `CandidateProfileController`。

### 5. 权限控制

所有接口都需要:
- `@UseGuards(JwtAuthGuard, RolesGuard)`
- `@Roles('recruiter')`
- 验证candidateId是否属于当前recruiter的application

### 6. 数据验证

使用class-validator装饰器:
- `@IsString()`, `@IsInt()`, `@IsEnum()`, `@IsOptional()` 等
- `skillLevel` 必须是 'Expert' | 'Intermediate' | 'Beginner'
- 日期格式验证

### 7. 测试数据

建议在数据库中为测试候选人添加一些示例数据,方便前端开发和测试。

## 前端集成

前端已经准备好以下文件:
- `/Users/pys/workspace/CATaur/next-client/src/lib/api/candidate-profile-types.ts` - 类型定义
- `/Users/pys/workspace/CATaur/next-client/src/lib/api/candidate-profile.ts` - API客户端

后端实现完成后,前端可以直接使用这些API进行集成。
