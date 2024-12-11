import mongoose, {  Document } from 'mongoose';

// Define the interface for the Auth document
export interface IPermissions extends Document {
    pageName:   String;
    read:       Boolean;
    write:      Boolean;
    execute:    Boolean
}
