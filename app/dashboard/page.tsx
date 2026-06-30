import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/guards";

export default async function DashboardIndexPage() {
  const user = await requireAuth();

  if (user.role === Role.ADMIN || user.role === Role.RECRUITER) {
    redirect("/dashboard/admin");
  }

  redirect("/dashboard/applicant");
}
