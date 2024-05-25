import { Request, Response } from 'express';
import { Document, Model } from 'mongoose';

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
    console.error('Error:', err.message);
    res.status(500).json({
        success: false,
        errors: [err.message],
        status: 500,
        message: '',
        data: {},
    });
    }
}