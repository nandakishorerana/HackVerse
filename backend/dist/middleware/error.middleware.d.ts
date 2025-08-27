import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;
    constructor(message: string, statusCode: number);
}
export declare const errorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
export declare const notFound: (req: Request, res: Response, next: NextFunction) => void;
export declare const catchAsync: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const successResponse: (res: Response, message: string, data?: any, statusCode?: number, pagination?: any) => Response;
export declare const errorResponse: (res: Response, message: string, statusCode?: number, errors?: any[]) => Response;
declare const _default: {
    AppError: typeof AppError;
    errorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
    notFound: (req: Request, res: Response, next: NextFunction) => void;
    catchAsync: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
    successResponse: (res: Response, message: string, data?: any, statusCode?: number, pagination?: any) => Response;
    errorResponse: (res: Response, message: string, statusCode?: number, errors?: any[]) => Response;
};
export default _default;
