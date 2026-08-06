import { z } from "zod";

// Zod Validation Helper
export async function validateBody<T>(req: Request, schema: z.ZodSchema<T>): Promise<{ data?: T; error?: any }> {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors };
    }
    return { data: parsed.data };
  } catch (err: any) {
    return { error: { _errors: ["Invalid JSON payload"] } };
  }
}

export function validateQuery<T>(url: string, schema: z.ZodSchema<T>): { data?: T; error?: any } {
  try {
    const { searchParams } = new URL(url);
    const queryObj: Record<string, any> = {};
    searchParams.forEach((val, key) => {
      queryObj[key] = val;
    });

    const parsed = schema.safeParse(queryObj);
    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors };
    }
    return { data: parsed.data };
  } catch (err: any) {
    return { error: { _errors: ["Invalid query parameters"] } };
  }
}
