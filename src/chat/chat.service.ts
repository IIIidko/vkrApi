import { Inject, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { PG_CONNECTION } from '../constants';
import { Pool, QueryResult } from 'pg';
import { ChatChunkResponse, ChatRequestBody, HistoryItem } from './types';

@Injectable()
export class ChatService {
  constructor(@Inject(PG_CONNECTION) private conn: Pool) {}

  async getHistories(userId: number): Promise<HistoryItem[]> {
    try {
      const resultRaw: QueryResult<{
        history_id: string;
        history_name: string;
      }> = await this.conn.query(
        `SELECT history_id, history_name FROM chat_histories WHERE user_id = $1;`,
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

  async createHistory(userId: number): Promise<string> {
    console.log('i am here2');

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
    console.log('i am here');
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

  async pipeResponseForChatAnswer(
    prompt: string,
    response: Response,
    userId: number,
    historyId?: string,
  ): Promise<void> {
    const realHistoryId: string =
      historyId ?? (await this.createHistory(userId));

    const readableStreamRaw: ReadableStream =
      await this.getReadableStreamAnswer(prompt);

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

    const stream = new ReadableStream({
      start(controller) {
        function push() {
          reader.read().then(({ done, value }) => {
            if (done) {
              const messageWithoutThink: string =
                message.split('</think>').at(-1) ?? message;
              console.log('ended answer', messageWithoutThink);
              addChatPair(messageWithoutThink);
              response.end();
              controller.close();
              return;
            }

            try {
              const decodedString: string = decoder.decode(
                value as AllowSharedBufferSource,
              );
              const chunkResponse: ChatChunkResponse = JSON.parse(
                decodedString,
              ) as ChatChunkResponse;

              if (
                !('done' in chunkResponse) &&
                !('response' in chunkResponse)
              ) {
                return;
              }

              if (chunkResponse.done) {
                console.log('last response', chunkResponse);
              }

              const chunkMessage: string = chunkResponse.response;
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
