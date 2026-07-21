import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  if (isAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f6f4] px-4">
      <LoginForm />
    </div>
  );
}
