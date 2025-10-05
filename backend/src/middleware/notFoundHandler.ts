import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle 404 Not Found errors
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
