import { Request, Response, NextFunction } from 'express';
import { IAuthenticatedRequest, IUser } from '@/types';
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}
export declare const protect: (req: Request, res: Response, next: NextFunction) => void;
export declare const restrictTo: (...roles: string[]) => (req: IAuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => void;
export declare const checkOwnership: (resourceUserField?: string) => (req: IAuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const validateApiKey: (req: Request, res: Response, next: NextFunction) => void;
export declare const userRateLimit: (maxRequests?: number, windowMs?: number) => (req: IAuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireEmailVerification: (req: IAuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requirePhoneVerification: (req: IAuthenticatedRequest, res: Response, next: NextFunction) => void;
declare const _default: {
    protect: (req: Request, res: Response, next: NextFunction) => void;
    restrictTo: (...roles: string[]) => (req: IAuthenticatedRequest, res: Response, next: NextFunction) => void;
    optionalAuth: (req: Request, res: Response, next: NextFunction) => void;
    checkOwnership: (resourceUserField?: string) => (req: IAuthenticatedRequest, res: Response, next: NextFunction) => void;
    validateApiKey: (req: Request, res: Response, next: NextFunction) => void;
    userRateLimit: (maxRequests?: number, windowMs?: number) => (req: IAuthenticatedRequest, res: Response, next: NextFunction) => void;
    requireEmailVerification: (req: IAuthenticatedRequest, res: Response, next: NextFunction) => void;
    requirePhoneVerification: (req: IAuthenticatedRequest, res: Response, next: NextFunction) => void;
};
export default _default;
