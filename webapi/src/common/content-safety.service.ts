import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

const CATEGORY_LABELS: Record<ViolationCategory, string> = {
    Hate: 'Hate Speech',
    Violence: 'Violence',
    Sexual: 'Sexual Content',
    SelfHarm: 'Self-Harm',
};

// Severity threshold: flag anything >= 2 as a violation
const SEVERITY_THRESHOLD = 2;

@Injectable()
export class ContentSafetyService {
    private readonly logger = new Logger(ContentSafetyService.name);

    constructor(private readonly configService: ConfigService) {}

    async checkJobOrder(title: string, description?: string): Promise<ContentSafetyResult> {
        const [titleResult, descriptionResult] = await Promise.all([
            this.checkField(title, 'Job Title'),
            description ? this.checkField(description, 'Description') : Promise.resolve(null),
        ]);

        const safe =
            (titleResult === null || titleResult.safe) &&
            (descriptionResult === null || descriptionResult.safe);

        return { safe, titleResult, descriptionResult };
    }

    private async checkField(text: string, fieldName: string): Promise<FieldSafetyResult> {
        let violations: Violation[] = [];
        
        try {
            const endpoint = this.configService.get<string>('AZURE_CONTENT_SAFETY_ENDPOINT');
            const key = this.configService.get<string>('AZURE_CONTENT_SAFETY_KEY');

            if (endpoint && key) {
                const url = `${endpoint.replace(/\/$/, '')}/contentsafety/text:analyze?api-version=2024-09-01`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Ocp-Apim-Subscription-Key': key,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: text.slice(0, 10000), // API limit
                        categories: ['Hate', 'Violence', 'Sexual', 'SelfHarm'],
                        outputType: 'FourSeverityLevels',
                    }),
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    this.logger.error(`Content Safety API error: ${response.status} ${errorBody}`);
                } else {
                    const data = await response.json();
                    for (const item of data.categoriesAnalysis ?? []) {
                        if (item.severity >= SEVERITY_THRESHOLD) {
                            violations.push({
                                category: item.category as ViolationCategory,
                                severity: item.severity,
                                label: CATEGORY_LABELS[item.category as ViolationCategory] ?? item.category,
                            });
                        }
                    }
                }
            } else {
                this.logger.warn('Azure Content Safety not configured, checking with fallback only');
            }
        } catch (error) {
            this.logger.error(`Content Safety check failed for field "${fieldName}": ${error}`);
        }

        // Always run the fallback check if Azure found nothing (or if Azure was skipped/errored)
        if (violations.length === 0) {
            const fallbackViolations = this.fallbackRegexCheck(text);
            violations.push(...fallbackViolations);
        }

        return {
            field: fieldName,
            safe: violations.length === 0,
            violations,
        };
    }

    private fallbackRegexCheck(text: string): Violation[] {
        const violations: Violation[] = [];
        const lower = text.toLowerCase();
        
        if (/\b(kill|murder|stab|shoot|violently)\b/i.test(lower)) {
            violations.push({
                category: 'Violence',
                severity: 4,
                label: CATEGORY_LABELS['Violence']
            });
        }
        
        if (/\b(hate|racist|slur)\b/i.test(lower)) {
             violations.push({
                category: 'Hate',
                severity: 4,
                label: CATEGORY_LABELS['Hate']
            });
        }
        
        if (/\b(porn|sex|naked)\b/i.test(lower)) {
             violations.push({
                category: 'Sexual',
                severity: 4,
                label: CATEGORY_LABELS['Sexual']
            });
        }
        
        return violations;
    }
}
