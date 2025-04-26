import { Injectable } from '@nestjs/common';
import { Response } from 'express';

interface ChatRequestBody {
  model: string;
  stream: boolean;
  prompt: string;
}

interface ChatLastResponse {
  model: string;
  created_at: string; // ISO дата-время
  response: string;
  done: boolean;
  done_reason: string;
  context: number[];
  total_duration: number;
  load_duration: number;
  prompt_eval_count: number;
  prompt_eval_duration: number;
  eval_count: number;
  eval_duration: number;
}

interface ChatChunkResponse {
  created_at: string; // ISO дата-время
  response: string;
  done: boolean;
  model: string;
}

@Injectable()
export class ChatService {
  async getReadableStreamAnswer(prompt: string): Promise<ReadableStream> {
    const body: ChatRequestBody = {
      model: 'deepseek-r1:14b',
      prompt: prompt,
      stream: true,
    };
    const rawAnswer = await fetch('http://ollama:11434/api/generate', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!rawAnswer || !rawAnswer.body) {
      throw new Error('no readable stream after request to chat');
    }

    return rawAnswer.body;
  }

  async pipeResponseForChatAnswer(
    prompt: string,
    response: Response,
  ): Promise<void> {
    const readableStreamRaw: ReadableStream =
      await this.getReadableStreamAnswer(prompt);

    const reader: ReadableStreamDefaultReader = readableStreamRaw.getReader();

    let message: string = '';
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      start(controller) {
        function push() {
          reader.read().then(({ done, value }) => {
            if (done) {
              response.end();
              controller.close();
              return;
            }
            try {
              const chunkResponse: ChatChunkResponse = JSON.parse(
                decoder.decode(value),
              );
              if (chunkResponse.done) {
                console.log('last response', chunkResponse);
              }
              const chunkMessage: string = chunkResponse.response;
              message += chunkMessage;
              console.log(chunkMessage, chunkResponse);
              response.write(chunkMessage);
            } catch (e) {
              console.log('error in chat chunk', e);
            }

            // Get the data and send it to the browser via the controller
            controller.enqueue(value);
            push();
          });
        }
        push();
      },
    });
    const result = await new Response(stream, {
      headers: { 'Content-Type': 'text/html' },
    }).text();
    console.log(result);
  }
}
