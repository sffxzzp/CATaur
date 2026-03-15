import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AiController } from './ai.controller';
import { AiChatService } from './ai-chat.service';
import { OpenAiChatAdapter } from './adapters/openai-chat.adapter';
import { AnthropicChatAdapter } from './adapters/anthropic-chat.adapter';
import { GeminiChatAdapter } from './adapters/gemini-chat.adapter';
import { OllamaChatAdapter } from './adapters/ollama-chat.adapter';

@Module({
  imports: [AdminModule],
  controllers: [AiController],
  providers: [
    AiChatService,
    OpenAiChatAdapter,
    AnthropicChatAdapter,
    GeminiChatAdapter,
    OllamaChatAdapter,
  ],
  exports: [AiChatService],
})
export class AiModule {}
