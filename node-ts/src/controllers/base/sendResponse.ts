import { Request, Response } from 'express';

import {AuditController} from '../../controllers/api/audit';
import { IAudit } from '../../models/interfaces/audit.interface';

const auditController: AuditController = new AuditController();

export abstract class SendResponse{
    public sendResponse(req: Request, res: Response, statusCode: number, data: any, totalData?: number) {

        const auditData: Partial<IAudit> = {

            // auditByName = req.authData ? `${ req.authData.name }` : ''
            // auditById   = req.authData ? `${ req.authData.id }` : ''
            // role        = req.authData ? req.authData.role : ''
            // permeation  = req.authData ? req.authData.permeation : ''
            // success     = req.method  === 'PUT' ? JSON.stringify({_id: req.params.id, body: req.body}) : JSON.stringify(success);

            action: req.url,
            method: req.method ,
            baseUrl: req.baseUrl,
            platform: req.headers['sec-ch-ua-platform']?.toString(),
            success: 'success',
            status: statusCode.toString(),
            error: '',
            auditByName: 'someAuditByName',
            auditById: 'someAuditById',
            auditOn: new Date(),
            role: 0,
            permeation: [0],
        };
    
        auditController.createAuditItem(auditData);
        res.status(statusCode).json({
          success: true,
          errors: [],
          status: statusCode,
          message: '',
          data: data,
          totalData
        });
    }

    protected sendErrorResponse(req: Request, res: Response, err: any) {

        const auditData: Partial<IAudit> = {

            // auditByName = req.authData ? `${ req.authData.name }` : ''
            // auditById   = req.authData ? `${ req.authData.id }` : ''
            // role        = req.authData ? req.authData.role : ''
            // permeation  = req.authData ? req.authData.permeation : ''
            // success     = req.method  === 'PUT' ? JSON.stringify({_id: req.params.id, body: req.body}) : JSON.stringify(success);

            action: req.url,
            method: req.method ,
            baseUrl: req.baseUrl,
            platform: req.headers['sec-ch-ua-platform']?.toString(),
            success: 'success',
            status: 'statusCode.toString()',
            error: '',
            auditByName: 'someAuditByName',
            auditById: 'someAuditById',
            auditOn: new Date(),
            role: 0,
            permeation: [0],
        };
    
        auditController.createAuditItem(auditData);


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