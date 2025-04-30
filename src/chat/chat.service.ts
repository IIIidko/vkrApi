import { Inject, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { PG_CONNECTION } from '../constants';
import { Pool, QueryResult } from 'pg';
import {
  ChatChunkResponse,
  ChatRequestBody,
  HistoryItem,
  MessageInRequest,
  MessagePair,
} from './types';

@Injectable()
export class ChatService {
  constructor(@Inject(PG_CONNECTION) private conn: Pool) {}

  async checkHistoryExists(
    historyId: string,
    userId: number,
  ): Promise<boolean> {
    try {
      const resultRaw: QueryResult<{
        history_id: string;
      }> = await this.conn.query(
        `SELECT history_id FROM chat_histories WHERE history_id = $1 AND user_id = $2;`,
        [historyId, userId],
      );
      return resultRaw.rows.length === 1;
    } catch (e) {
      console.log('error in checking history exists', e);
      return false;
    }
  }

  async getMessagesByHistoryId(
    historyId: string,
    userId: number,
  ): Promise<MessagePair[]> {
    try {
      const resultRaw: QueryResult<{
        request_message: string;
        answer: string;
        pair_id: string;
      }> = await this.conn.query(
        `SELECT request_message, answer, pair_id FROM chat_messages WHERE history_id = $1 AND user_id = $2;`,
        [historyId, userId],
      );
      if (resultRaw.rows.length === 0) return [];
      return resultRaw.rows.map((pair) => {
        return {
          requestMessage: pair.request_message,
          answer: pair.answer,
          pairId: pair.pair_id,
        };
      });
    } catch (e) {
      console.log(
        'error in selection messages by history id with check user id',
        e,
      );
      return [];
    }
  }

  async getLastMessageByHistoryId(
    historyId: string,
    userId: number,
  ): Promise<MessagePair> {
    try {
      const resultRaw: QueryResult<{
        request_message: string;
        answer: string;
        pair_id: string;
      }> = await this.conn.query(
        `SELECT request_message, answer, pair_id FROM chat_messages WHERE history_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1;`,
        [historyId, userId],
      );
      if (resultRaw.rows.length === 0)
        return {
          requestMessage: '',
          answer: '',
          pairId: '',
        };
      return {
        requestMessage: resultRaw.rows[0].request_message,
        answer: resultRaw.rows[0].answer,
        pairId: resultRaw.rows[0].pair_id,
      };
    } catch (e) {
      console.log(
        'error in selection messages by history id with check user id',
        e,
      );
      return {
        requestMessage: '',
        answer: '',
        pairId: '',
      };
    }
  }

  async getHistories(userId: number): Promise<HistoryItem[]> {
    try {
      const resultRaw: QueryResult<{
        history_id: string;
        history_name: string;
      }> = await this.conn.query(
        `SELECT history_id, history_name FROM chat_histories WHERE user_id = $1 ORDER BY updated_at DESC;`,
        [userId],
      );
      if (resultRaw.rows.length === 0) {
        return [];
      }
      return resultRaw.rows.map((row) => {
        return {
          id: row.history_id,
          historyName: row.history_name,
        };
      });
    } catch (e) {
      console.log('error in select histories by user', e);
      return [];
    }
  }

  async getMessagesByHistoryToChat(
    historyId: string,
    userId: number,
  ): Promise<MessageInRequest[]> {
    try {
      const resultRaw: QueryResult<{
        request_message: string;
        answer: string;
      }> = await this.conn.query(
        `SELECT request_message, answer FROM chat_messages WHERE history_id = $1 AND user_id = $2 ORDER BY created_at DESC`,
        [historyId, userId],
      );
      const result: MessageInRequest[] = [];
      resultRaw.rows.forEach((pair) => {
        result.push({
          role: 'user',
          content: pair.request_message,
        });

        result.push({
          role: 'assistant',
          content: pair.answer,
        });
      });
      return result;
    } catch (e) {
      console.log(
        'error in getting messages by history id for chat, and check user id',
        e,
      );
      return [];
    }
  }

  async getReadableStreamAnswer({
    prompt,
    userId,
    historyId,
    contextId,
  }: {
    prompt: string;
    historyId?: string;
    contextId?: string;
    userId?: number;
  }): Promise<ReadableStream> {
    const historyMessages: MessageInRequest[] =
      historyId && userId
        ? await this.getMessagesByHistoryToChat(historyId, userId)
        : [];

    const body: ChatRequestBody = {
      model: 'deepseek-r1:14b',
      messages: [
        {
          role: 'system',
          content:
            "You are a helpful assistant. Always answer in the user's language; default is Russian. Do not use Chinese or any other languages, except when explicitly requested by the user. Prefer Russian unless the content is purely technical. Use clean formatting: Markdown, bullet points, and tables if needed. Make answers well-structured and readable.",
        },
        ...historyMessages,
        {
          role: 'user',
          content: prompt,
        },
      ],
      stream: true,
      options: {
        temperature: 0.5,
      },
    };
    const rawAnswer = await fetch('http://ollama:11434/api/chat', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!rawAnswer || !rawAnswer.body) {
      throw new Error('no readable stream after request to chat');
    }

    return rawAnswer.body;
  }

  async createHistory(userId: number): Promise<string> {
    const resultRaw: QueryResult<{ history_id: string }> =
      await this.conn.query(
        `INSERT INTO chat_histories (user_id) VALUES ($1) RETURNING history_id;`,
        [userId],
      );
    const historyId = resultRaw?.rows[0]?.history_id;
    if (historyId) {
      return historyId;
    } else {
      throw new Error(
        'error in bd when create history id, maybe no user in bd',
      );
    }
  }

  async addChatPairToDB(
    requestMessage: string,
    answer: string,
    userId: number,
    historyId: string,
  ): Promise<void> {
    try {
      await this.conn.query(
        `INSERT INTO chat_messages (user_id, request_message, answer, history_id) VALUES ($1, $2, $3, $4);`,
        [userId, requestMessage, answer, historyId],
      );
    } catch (e) {
      console.log(
        'error in adding chat pair to db, maybe no chat history or user id',
        e,
      );
    }
    this.updateHistoryLastEdit(historyId).catch((e) => {
      console.log('updating chat history updated_at', e);
    });
  }

  async increaseMessagesCount(
    historyId: string,
  ): Promise<{ isNeedUpdateName: boolean }> {
    try {
      const resultRaw: QueryResult<{ messages_count: number }> =
        await this.conn.query(
          'UPDATE chat_histories SET messages_count = messages_count + 1, updated_at = NOW() WHERE history_id = $1 RETURNING messages_count;',
          [historyId],
        );

      if (resultRaw?.rows[0]?.messages_count === 1) {
        return { isNeedUpdateName: true };
      }
    } catch (e) {
      console.log('error in increasing messages_count in histories', e);
    }
    return { isNeedUpdateName: false };
  }

  async updateHistoryName(historyId: string, newName: string) {
    try {
      await this.conn.query(
        `UPDATE chat_histories SET history_name = $1 WHERE history_id = $2;`,
        [newName, historyId],
      );
    } catch (e) {
      console.log('error when updating chat history name', e);
    }
  }

  async updateHistoryLastEdit(historyId: string) {
    try {
      await this.conn.query(
        `UPDATE chat_histories SET updated_at = NOW() WHERE history_id = $1;`,
        [historyId],
      );
    } catch (e) {
      console.log('error when updating chat history updated_at', e);
    }
  }

  async deleteHistoryIfNoMessages(historyId: string) {
    try {
      await this.conn.query(
        `DELETE FROM chat_histories WHERE history_id = $1 AND messages_count = 0;`,
        [historyId],
      );
    } catch (e) {
      console.log(
        'error when deleting history with no messages by history id',
        e,
      );
    }
  }

  async pipeResponseForChatAnswer(
    prompt: string,
    response: Response,
    userId: number,
    historyId?: string,
  ): Promise<void> {
    const realHistoryId: string =
      historyId ?? (await this.createHistory(userId));

    const readableStreamRaw: ReadableStream =
      await this.getReadableStreamAnswer({
        prompt: prompt,
        userId: userId,
        historyId: historyId ?? undefined,
      });

    const reader: ReadableStreamDefaultReader = readableStreamRaw.getReader();

    let message: string = '';
    const decoder = new TextDecoder();

    const addChatPair: (answer: string) => void = (answer: string) => {
      this.addChatPairToDB(prompt, answer, userId, realHistoryId).catch((e) => {
        console.log('error in adding chat pair', e);
      });
      this.increaseMessagesCount(realHistoryId)
        .then(({ isNeedUpdateName }) => {
          if (isNeedUpdateName) {
            console.log('update name');
            this.updateHistoryName(
              realHistoryId,
              prompt.length > 25
                ? prompt.split('').slice(0, 25).join('')
                : prompt,
            ).catch((e) => {
              console.log('error when updating history name', e);
            });
          }
        })
        .catch(console.log);
    };

    const clearIfAbort: () => void = () => {
      this.deleteHistoryIfNoMessages(realHistoryId).catch((e) => {
        console.log(e, 'in clearing after abort');
      });
    };

    let isClosed: boolean = false;

    const stream = new ReadableStream({
      start(controller) {
        if (!historyId) {
          response.write(`/historyId:${realHistoryId}/`);
        }
        response.on('close', () => {
          if (!isClosed) {
            console.log('закрыл');
            isClosed = true;
            clearIfAbort();
            reader.cancel().catch((e) => {
              console.log('ollama cancel', e);
            });
          }
        });
        function push() {
          reader.read().then(({ done, value }) => {
            if (isClosed) {
              response.end();
              controller.close();
              return;
            }
            if (done) {
              const messageWithoutThink: string =
                message.split('</think>').at(-1) ?? message;
              addChatPair(messageWithoutThink);
              console.log('added message to chat pair', messageWithoutThink);
              response.end();
              controller.close();
              isClosed = true;
              return;
            }

            try {
              const decodedString: string = decoder.decode(
                value as AllowSharedBufferSource,
              );
              const chunkResponse: ChatChunkResponse = JSON.parse(
                decodedString,
              ) as ChatChunkResponse;

              console.log('chunk response', chunkResponse);

              if (!('done' in chunkResponse) && !('message' in chunkResponse)) {
                return;
              }

              const chunkMessage: string = chunkResponse.message.content;
              message += chunkMessage;
              response.write(chunkMessage);
            } catch (e) {
              console.log('error in chat chunk', e);
            }

            controller.enqueue(value);
            push();
          });
        }
        push();
      },
    });
    await new Response(stream, {
      headers: { 'Content-Type': 'text/html' },
    }).text();
  }
}
