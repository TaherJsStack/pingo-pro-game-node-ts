import { Request, Response } from 'express';
import { logger } from '../../util/logger';

export abstract class SendResponse {
    public sendResponse(req: Request, res: Response, statusCode: number, data: any, totalData?: number, message?: string, extra?: Record<string, any>) {
        res.status(statusCode).json({
            success: true,
            errors: [],
            status: statusCode,
            message: message || '',
            data,
            totalData,
            ...extra,
        });
    }

    protected sendErrorResponse(req: Request, res: Response, err: any) {
        const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        let errorMessage: string;

        if (typeof err === 'object' && err !== null && 'message' in err) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        } else {
            errorMessage = 'An unknown error occurred';
        }
        logger.error('request error', { statusCode, message: errorMessage });
        res.status(statusCode).json({
            success: false,
            errors: [errorMessage],
            status: statusCode,
            message: '',
            data: {},
        });
    }
}
