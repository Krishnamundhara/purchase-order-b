import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError extends ApiResponse {
  success: false;
  error: string;
}

export const errorHandler = (
  err: Error | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: formattedErrors,
    });
  }

  const message = err instanceof Error ? err.message : 'Unknown error';

  if (message.includes('duplicate key')) {
    return res.status(409).json({
      success: false,
      error: 'Order number already exists',
    });
  }

  res.status(500).json({
    success: false,
    error: message || 'Internal server error',
  });
};
