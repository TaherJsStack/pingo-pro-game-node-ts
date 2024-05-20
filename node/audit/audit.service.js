var events     = require('events');
var auditModel = require('../models/audit.model');
var Audit      = require('../models/audit');
var util       = require('../util/utility');

var emitter = new events.EventEmitter();

const auditEvent = 'audit';
emitter.on(auditEvent, function(audit) {
    // steps of actions - save into db
    // console.log('audit -->', audit)
    try {
        const auditSave = new Audit(audit)
        auditSave.save().then(res => {} ).catch(err => {})
    } catch (error) {
       // console.log("Audit Event Emitter - error : " + error);
    }
});

exports.prepareAudit = function(req, success, error) {

    // console.log('req.authData ----------->', req.authData)

    let auditOn     = util.dateFormat(),
        action      = `${ req.url }`,
        method      = `${ req.method }`
        baseUrl     = `${ req.baseUrl }`
        platform    = `${ req.headers['sec-ch-ua-platform'] }`
        auditByName = req.authData ? `${ req.authData.name }` : ''
        auditById   = req.authData ? `${ req.authData.id }` : ''
        role        = req.authData ? req.authData.role : ''
        permeation  = req.authData ? req.authData.permeation : ''
        success     = req.method  === 'PUT' ? JSON.stringify({_id: req.params.id, body: req.body}) : JSON.stringify(success);

    let status = 200;
    if (error)
        status = 500;

    var auditObj = new auditModel.Audit(action, method, baseUrl, platform, success, status, error, auditByName, auditById, auditOn, role, permeation)

    // console.log('auditObj   ->', auditObj)
    
    emitter.emit(auditEvent, auditObj);
}