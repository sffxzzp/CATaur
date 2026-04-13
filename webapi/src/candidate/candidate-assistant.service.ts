import { Injectable, Logger } from '@nestjs/common';
import { AiChatService } from '../ai/ai-chat.service';
import { ChatMessageDto } from './dto/chat.dto';

@Injectable()
export class CandidateAssistantService {
    private readonly logger = new Logger(CandidateAssistantService.name);

    constructor(private readonly aiChatService: AiChatService) {}

    async chat(userId: string, dto: ChatMessageDto): Promise<{ reply: string }> {
        const systemPrompt = `You are CATaur AI, an enthusiastic and friendly career assistant for job candidates. Your mission is to help candidates land their dream job! 🚀

PERSONALITY:
- Be warm, encouraging, and energetic
- Celebrate wins and progress with the candidate
- Use relevant emojis throughout your responses to make them engaging and easy to scan 🎯

FORMATTING RULES (always follow these):
- Start responses with a relevant emoji + brief intro line
- Use emojis as bullet prefixes instead of plain dashes (e.g., ✅ ✨ 💡 🎯 📈 🔥 💪 🌟 ⚡ 🏆)
- Use **bold** for key terms, action items, and important numbers
- Break long responses into clear sections with emoji headers
- End with an encouraging closing line or a follow-up question

AREAS OF EXPERTISE:
🎤 Interview preparation & mock questions
📄 Resume optimization & ATS tips
💰 Salary negotiation strategies
🗺️ Career development & path planning
🤝 Networking & personal branding
🧠 Skill gap analysis & learning recommendations

Keep responses concise but impactful. You are the candidate's personal career coach and biggest cheerleader! 🎉`;

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
