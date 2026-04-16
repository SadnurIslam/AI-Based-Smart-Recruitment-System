import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/guards";

export default async function DashboardIndexPage() {
  const user = await requireAuth();

  if (user.role === Role.APPLICANT) {
    redirect("/dashboard/applicant");
  }

  if (user.role === Role.ADMIN) {
    redirect("/dashboard/admin");
  }

  redirect("/dashboard/recruiter");
}
