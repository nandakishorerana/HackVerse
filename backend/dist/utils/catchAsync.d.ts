import { Request, Response, NextFunction } from 'express';
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;
declare const catchAsync: (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => void;
export { catchAsync };
export default catchAsync;
