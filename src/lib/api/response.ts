import { NextResponse } from "next/server";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

export function apiSuccess<T>(data: T, message = "Operation successful", status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

export function apiError(message = "An error occurred", status = 400, errors?: any) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      message,
      errors: errors || null,
    },
    { status }
  );
}
