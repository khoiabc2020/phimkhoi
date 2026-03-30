import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
    action: string;           // e.g. "DELETE_MOVIE", "CHANGE_ROLE", "SYNC_MOVIES"
    entity: string;           // e.g. "movie", "user", "comment", "notification"
    entityId?: string;
    entityName?: string;      // Display name for the entity
    adminId: string;
    adminName: string;
    adminEmail: string;
    details?: Record<string, unknown>;
    ip?: string;
    status: "success" | "error";
    errorMessage?: string;
    createdAt: Date;
}

const AuditLogSchema: Schema<IAuditLog> = new Schema(
    {
        action: { type: String, required: true, index: true },
        entity: { type: String, required: true, index: true },
        entityId: { type: String },
        entityName: { type: String },
        adminId: { type: String, required: true, index: true },
        adminName: { type: String, required: true },
        adminEmail: { type: String, required: true },
        details: { type: Schema.Types.Mixed },
        ip: { type: String },
        status: { type: String, enum: ["success", "error"], default: "success" },
        errorMessage: { type: String },
    },
    { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });

const AuditLog: Model<IAuditLog> =
    mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
