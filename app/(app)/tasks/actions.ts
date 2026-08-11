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

export async function completeTaskAction(taskId: string) {
  const userRole = await getRoleFromSession();
  if (!hasPermission(userRole, "MANAGE_SUBSCRIPTIONS")) { // Assuming staff can manage tasks
    return { error: "Unauthorized." };
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  const completedCount = await prisma.task.count({
    where: { status: "COMPLETED" },
  });

  if (completedCount > 15) {
    const excess = completedCount - 15;
    const oldestCompleted = await prisma.task.findMany({
      where: { status: "COMPLETED" },
      orderBy: [{ completedAt: "asc" }, { createdAt: "asc" }],
      take: excess,
      select: { id: true },
    });

    if (oldestCompleted.length > 0) {
      await prisma.task.deleteMany({
        where: { id: { in: oldestCompleted.map((t) => t.id) } },
      });
    }
  }

  revalidatePath("/tasks");
  return { success: true };
}
