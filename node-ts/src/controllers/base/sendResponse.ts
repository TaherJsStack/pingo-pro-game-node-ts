import { Request, Response } from 'express';

export abstract class SendResponse {
    public sendResponse(req: Request, res: Response, statusCode: number, data: any, totalData?: number, message?: string) {
        res.status(statusCode).json({
            success: true,
            errors: [],
            status: statusCode,
            message: message || '',
            data: data,
            totalData
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
        console.error('Error:', err?.message ?? err);
        res.status(statusCode).json({
            success: false,
            errors: [errorMessage],
            status: statusCode,
            message: '',
            data: {},
        });
    }
}
