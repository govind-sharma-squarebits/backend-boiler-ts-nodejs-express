import { Response } from 'express';
import { env } from '../../config/env';
import { ApiErrorResponse, ApiResponse } from '../types/api.types';

const includeDeveloperMessage = env.NODE_ENV !== 'production';

export function buildErrorBody(
  userMessage: string,
  developerMessage: string,
  extra?: Record<string, unknown>
): ApiErrorResponse {
  const body: ApiErrorResponse = {
    success: false,
    message: userMessage,
    ...extra,
  };

  if (includeDeveloperMessage) {
    body.developerMessage = developerMessage;
  }

  return body;
}

export function sendError(
  res: Response,
  statusCode: number,
  userMessage: string,
  developerMessage: string,
  extra?: Record<string, unknown>
): void {
  res.status(statusCode).json(buildErrorBody(userMessage, developerMessage, extra));
}

export function sendSuccess<T>(
  res: Response,
  userMessage: string,
  data?: T,
  status = 200
): void {
  const body: ApiResponse<T> = { success: true, message: userMessage, data };
  res.status(status).json(body);
}
