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
exports.SendResponse = SendResponse;
