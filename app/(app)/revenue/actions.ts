"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { Role } from "@prisma/client";

async function getRoleFromSession(): Promise<Role | null> {
  const session = await auth();
  return (session?.user as any)?.role || null;
}

export async function deleteSaleAction(saleId: string) {
  const userRole = await getRoleFromSession();
  if (!hasPermission(userRole, "MANAGE_SUBSCRIPTIONS")) {
    return { error: "Unauthorized." };
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: saleId },
    include: { profile: true },
  });

  if (!subscription) {
    return { error: "Sale record not found." };
  }

  await prisma.subscription.delete({
    where: { id: saleId },
  });

  revalidatePath("/analytics");
  revalidatePath("/revenue");
  revalidatePath("/subscriptions");
  if (subscription.profile?.masterAccountId) {
    revalidatePath(`/accounts/${subscription.profile.masterAccountId}`);
  }

  return { success: true };
}
