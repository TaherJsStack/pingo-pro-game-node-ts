exports.Audit = class Audit {

    constructor(action, method, baseUrl, platform, success, status, error, auditByName, auditById, auditOn, role, permeation){
        this.action      = action;
        this.method      = method;
        this.baseUrl     = baseUrl;
        this.platform    = platform;
        this.success     = success;
        this.status      = status;
        this.error       = error;
        this.auditByName = auditByName;
        this.auditById   = auditById;
        this.auditOn     = auditOn;
        this.role        = role;
        this.permeation  = permeation
    }
}