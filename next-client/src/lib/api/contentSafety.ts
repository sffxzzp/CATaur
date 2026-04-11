import { request } from './request';

export type ViolationCategory = 'Hate' | 'Violence' | 'Sexual' | 'SelfHarm';

export interface Violation {
    category: ViolationCategory;
    severity: number; // 0-6
    label: string;
}

export interface FieldSafetyResult {
    field: string;
    safe: boolean;
    violations: Violation[];
}

export interface ContentSafetyResult {
    safe: boolean;
    titleResult: FieldSafetyResult | null;
    descriptionResult: FieldSafetyResult | null;
}

export async function checkContentSafety(params: {
    title: string;
    description?: string;
}): Promise<ContentSafetyResult> {
    return request<ContentSafetyResult>('/api/recruiter/content-safety/check', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}
