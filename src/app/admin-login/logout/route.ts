import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/admin";

export async function GET(req: Request) {
  clearAdminSession();
  return NextResponse.redirect(new URL("/admin-login", req.url));
}
