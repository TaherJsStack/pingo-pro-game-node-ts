"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
class InvoiceService {
    constructor() {
        this.dataSubject = new rxjs_1.Subject();
    }
    setData(data) {
        this.dataSubject.next(data);
    }
    getDataObservable() {
        return this.dataSubject.asObservable();
    }
}
exports.default = new InvoiceService();
