import { Injectable, Logger } from '@nestjs/common';
import { AiChatService } from '../ai/ai-chat.service';
import { ChatMessageDto } from './dto/chat.dto';

@Injectable()
export class CandidateAssistantService {
    private readonly logger = new Logger(CandidateAssistantService.name);

    constructor(private readonly aiChatService: AiChatService) {}

    async chat(userId: string, dto: ChatMessageDto): Promise<{ reply: string }> {
        const systemPrompt = `You are a professional career assistant helping job candidates. Provide helpful, concise advice on:
- Interview preparation and tips
- Resume optimization
- Salary negotiation strategies
- Career development guidance
Keep responses practical and encouraging. Use bullet points when listing multiple items.`;

        try {
            const result = await this.aiChatService.createChatCompletion({
                provider: 'openai',
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: dto.message },
                ],
                maxTokens: 500,
            });

            return { reply: result.outputText || 'I apologize, but I could not generate a response. Please try again.' };
        } catch (err) {
            this.logger.error(`AI chat failed for user ${userId}: ${err?.message}`, err?.stack);
            return { reply: 'I apologize, but I encountered an error. Please try again later.' };
        }
    }
}
