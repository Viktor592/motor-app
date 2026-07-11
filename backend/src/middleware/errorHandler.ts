import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  if (err instanceof ZodError) {
    const first = err.errors[0];
    return res.status(400).json({
      error: first?.message ?? 'Некорректные данные',
      code: 'VALIDATION_ERROR',
      fields: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  console.error('[ERROR]', err);
  return res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    code: 'INTERNAL_ERROR',
  });
}
