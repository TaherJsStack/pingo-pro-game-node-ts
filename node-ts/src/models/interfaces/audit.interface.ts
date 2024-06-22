import mongoose, {  Document } from 'mongoose';

export interface IAudit extends Document {
    action:       String ,
    method:       String,
    baseUrl:      String,
    platform:     String,
    success:      String,
    status:       String,
    error:        String,
    auditByName:  String,
    auditById:    String,
    auditOn:      Date,
    role:         Number,
    permeation:   Number[]
}