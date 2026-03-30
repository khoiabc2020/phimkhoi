import AuditLog from "@/models/AuditLog";

interface AuditParams {
    action: string;
    entity: string;
    entityId?: string;
    entityName?: string;
    adminId: string;
    adminName: string;
    adminEmail: string;
    details?: Record<string, unknown>;
    ip?: string;
    status?: "success" | "error";
    errorMessage?: string;
}

export async function createAuditLog(params: AuditParams) {
    try {
        await AuditLog.create({
            ...params,
            status: params.status ?? "success",
        });
    } catch (err) {
        // Don't let audit logging failures break the main operation
        console.error("Failed to create audit log:", err);
    }
}
