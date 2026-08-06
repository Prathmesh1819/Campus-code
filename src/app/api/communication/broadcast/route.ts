import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { getAuthenticatedUser, authorizeRole } from "@/lib/api/auth-middleware";
import { sendAdminBroadcast } from "@/lib/communication/broadcast-service";

const broadcastSchema = z.object({
  title: z.string().min(3, "Title is required"),
  message: z.string().min(10, "Message is required"),
  target_role: z.string().optional(),
  department_id: z.string().optional(),
  class_id: z.string().optional(),
  sendEmail: z.boolean().default(true),
  actionUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || !authorizeRole(user, ["admin"])) {
    return apiError("Admin privileges required", 403);
  }

  const { data: body, error: valError } = await validateBody(req, broadcastSchema);
  if (valError) return apiError("Validation failed", 400, valError);

  const result = await sendAdminBroadcast(user.id, body!);
  if (!result.success) return apiError(result.error || "Broadcast failed", 500);

  return apiSuccess({ recipientCount: result.recipientCount }, "Admin broadcast dispatched successfully");
}
