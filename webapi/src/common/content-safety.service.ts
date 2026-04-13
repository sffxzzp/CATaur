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

// Severity threshold: flag anything >= 0 as a violation
// Azure returns 0/2/4/6 for FourSeverityLevels. We accept ANY non-zero severity.
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
        let azureViolations: Violation[] = [];
        let azureWorked = false;
        
        try {
            const endpoint = this.configService.get<string>('AZURE_CONTENT_SAFETY_ENDPOINT');
            const key = this.configService.get<string>('AZURE_CONTENT_SAFETY_KEY');

            if (endpoint && key) {
                const url = `${endpoint.replace(/\/$/, '')}/contentsafety/text:analyze?api-version=2024-09-01`;

                this.logger.log(`[ContentSafety] Calling Azure for field "${fieldName}", text length: ${text.length}`);

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
                    this.logger.log(`[ContentSafety] Azure response for "${fieldName}": ${JSON.stringify(data.categoriesAnalysis)}`);

                    azureWorked = true;
                    for (const item of data.categoriesAnalysis ?? []) {
                        if (item.severity >= SEVERITY_THRESHOLD) {
                            azureViolations.push({
                                category: item.category as ViolationCategory,
                                severity: item.severity,
                                label: CATEGORY_LABELS[item.category as ViolationCategory] ?? item.category,
                            });
                        }
                    }
                }
            } else {
                this.logger.warn('Azure Content Safety not configured (missing AZURE_CONTENT_SAFETY_ENDPOINT or AZURE_CONTENT_SAFETY_KEY), using fallback only');
            }
        } catch (error) {
            this.logger.error(`Content Safety API call failed for field "${fieldName}": ${error}`);
        }

        // Always run the fallback regex check as a second layer of defense
        const fallbackViolations = this.fallbackRegexCheck(text);

        if (fallbackViolations.length > 0) {
            this.logger.log(`[ContentSafety] Fallback regex found ${fallbackViolations.length} violation(s) for "${fieldName}"`);
        }

        // Merge: use both Azure AND fallback results (union of violations)
        const allViolations = this.mergeViolations(azureViolations, fallbackViolations);

        return {
            field: fieldName,
            safe: allViolations.length === 0,
            violations: allViolations,
        };
    }

    /** Merge violations from two sources, deduplicating by category (keeping highest severity) */
    private mergeViolations(a: Violation[], b: Violation[]): Violation[] {
        const map = new Map<ViolationCategory, Violation>();
        for (const v of [...a, ...b]) {
            const existing = map.get(v.category);
            if (!existing || v.severity > existing.severity) {
                map.set(v.category, v);
            }
        }
        return Array.from(map.values());
    }

    private fallbackRegexCheck(text: string): Violation[] {
        const violations: Violation[] = [];
        const lower = text.toLowerCase();
        
        // Self-Harm detection (English + Chinese)
        if (
            /\b(suicide|suicidal|self[- ]?harm|cut myself|cutting myself|cut my wrist|slit my wrist|hang myself|kill myself|end my life|end it all|want to die|wanna die|overdose|jump off)\b/i.test(lower) ||
            /(自杀|自残|割腕|割手腕|跳楼|吞药|上吊|自我伤害|不想活|活不下去|了结|轻生)/.test(text)
        ) {
            violations.push({
                category: 'SelfHarm',
                severity: 6,
                label: CATEGORY_LABELS['SelfHarm'],
            });
        }
        
        // Violence detection (English + Chinese)
        if (
            /\b(kill|murder|stab|shoot|violently|assault|attack|bomb|threat|weapon|execute|slaughter|behead|strangle|torture)\b/i.test(lower) ||
            /(杀人|杀害|暴力|袭击|炸弹|威胁|武器|屠杀|斩首|勒死|折磨)/.test(text)
        ) {
            violations.push({
                category: 'Violence',
                severity: 4,
                label: CATEGORY_LABELS['Violence'],
            });
        }
        
        // Hate speech detection (English + Chinese)
        if (
            /\b(hate|racist|racial slur|slur|bigot|supremacist|nazi|discriminat)\b/i.test(lower) ||
            /(仇恨|种族歧视|歧视|纳粹)/.test(text)
        ) {
            violations.push({
                category: 'Hate',
                severity: 4,
                label: CATEGORY_LABELS['Hate'],
            });
        }
        
        // Sexual content detection (English + Chinese)
        if (
            /\b(porn|pornography|sex|naked|nude|explicit|obscene)\b/i.test(lower) ||
            /(色情|裸体|淫秽)/.test(text)
        ) {
            violations.push({
                category: 'Sexual',
                severity: 4,
                label: CATEGORY_LABELS['Sexual'],
            });
        }
        
        return violations;
    }
}
