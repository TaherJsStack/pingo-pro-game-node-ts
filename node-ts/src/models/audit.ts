import { IAudit } from "./interfaces/audit.interface";
import mongoose, { Schema, Document } from 'mongoose';

// const mongoose = require('mongoose');

// const authSchema: Schema<IAuth> = new Schema<IAuth>({
const AuditSchema:Schema<IAudit> = new Schema<IAudit>({
    action:       { type: String },
    method:       { type: String },
    baseUrl:      { type: String },
    platform:     { type: String },
    success:      { type: String },
    status:       { type: String },
    error:        { type: String },
    auditByName:  { type: String },
    auditById:    { type: String },
    auditOn:      { type: Date },
    role:         { type: Number },
    permeation:   { type: [Number] }

}, {
    timestamps: true
  });

const AuditModel = mongoose.model<IAudit>('Audit', AuditSchema);

export default AuditModel;