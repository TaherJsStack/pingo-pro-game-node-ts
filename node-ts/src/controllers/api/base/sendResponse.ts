import { Response } from 'express';

export abstract class SendResponse{
    public sendResponse(res: Response, statusCode: number, data: any) {
        res.status(statusCode).json({
          success: true,
          errors: [],
          status: statusCode,
          message: '',
          data: data,
        });
    }

    protected sendErrorResponse(res: Response, err: any) {
        let errorMessage: string;

        if (typeof err === 'object' && err !== null && 'message' in err) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        } else {
            errorMessage = 'An unknown error occurred';
        }
        console.error('Error:', err.message);
        res.status(500).json({
            success: false,
            errors: [errorMessage],
            status: 500,
            message: '',
            data: {},
        });
    }
}