import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/auth";

export async function requireAuth() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  return session.user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}
