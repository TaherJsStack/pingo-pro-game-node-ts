"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendResponse = void 0;
class SendResponse {
    sendResponse(res, statusCode, data) {
        res.status(statusCode).json({
            success: true,
            errors: [],
            status: statusCode,
            message: '',
            data: data,
        });
    }
    sendErrorResponse(res, err) {
        let errorMessage;
        if (typeof err === 'object' && err !== null && 'message' in err) {
            errorMessage = err.message;
        }
        else if (typeof err === 'string') {
            errorMessage = err;
        }
        else {
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
exports.SendResponse = SendResponse;
