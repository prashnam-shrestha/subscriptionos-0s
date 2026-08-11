import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // 1. Find all active subscriptions that have passed their expiry date
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "Active",
        expiryDate: {
          lt: now,
        },
      },
      select: {
        id: true,
        profileId: true,
      },
    });

    if (expiredSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No subscriptions to expire.",
        updatedCount: 0,
      });
    }

    const expiredIds = expiredSubscriptions.map((s) => s.id);
    const affectedProfileIds = expiredSubscriptions
      .map((s) => s.profileId)
      .filter((id): id is string => Boolean(id));

    // 2. Bulk update status to "Expired"
    await prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: {
          id: { in: expiredIds },
        },
        data: {
          status: "Expired",
        },
      });

      // 3. Mark associated profiles as needing re-notification
      if (affectedProfileIds.length > 0) {
        await tx.profile.updateMany({
          where: {
            id: { in: affectedProfileIds },
          },
          data: {
            needsRenotify: true,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      updatedCount: expiredIds.length,
      affectedProfileIds,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
