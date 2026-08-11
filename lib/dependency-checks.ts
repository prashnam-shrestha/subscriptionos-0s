"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/* ==========================================================================
   CUSTOMER DEPENDENCIES & ACTIONS
   ========================================================================== */

export async function checkCustomerDependencies(customerId: string) {
  const [activeSubscriptions, totalSubscriptions] = await Promise.all([
    prisma.subscription.count({
      where: { customerId, status: "Active" },
    }),
    prisma.subscription.count({
      where: { customerId },
    }),
  ]);

  return {
    hasActiveSubscriptions: activeSubscriptions > 0,
    hasHistory: totalSubscriptions > 0,
    activeCount: activeSubscriptions,
    totalCount: totalSubscriptions,
  };
}

export async function deleteOrDeactivateCustomerAction(customerId: string) {
  const deps = await checkCustomerDependencies(customerId);

  if (deps.hasHistory) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { isActive: false },
    });
    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);
    return {
      success: true,
      mode: "deactivated" as const,
      message: `Customer has ${deps.totalCount} recorded subscription(s). Profile was deactivated instead of deleted to protect historical data.`,
    };
  } else {
    await prisma.customer.delete({
      where: { id: customerId },
    });
    revalidatePath("/customers");
    return {
      success: true,
      mode: "deleted" as const,
      message: "Customer record has zero historical subscriptions and was permanently deleted.",
    };
  }
}

export async function forceDeleteCustomerAction(customerId: string) {
  await prisma.$transaction([
    prisma.subscription.deleteMany({ where: { customerId } }),
    prisma.customer.delete({ where: { id: customerId } }),
  ]);
  revalidatePath("/customers");
  return {
    success: true,
    message: "Customer and all associated subscription records were permanently deleted.",
  };
}

/* ==========================================================================
   PRODUCT DEPENDENCIES & ACTIONS
   ========================================================================== */

export async function checkProductDependencies(productId: string) {
  const [activeSubscriptions, totalSubscriptions] = await Promise.all([
    prisma.subscription.count({
      where: { productId, status: "Active" },
    }),
    prisma.subscription.count({
      where: { productId },
    }),
  ]);

  return {
    hasActiveSubscriptions: activeSubscriptions > 0,
    hasHistory: totalSubscriptions > 0,
    activeCount: activeSubscriptions,
    totalCount: totalSubscriptions,
  };
}

export async function deleteOrDeactivateProductAction(productId: string) {
  const deps = await checkProductDependencies(productId);

  if (deps.hasHistory) {
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
    revalidatePath("/products");
    return {
      success: true,
      mode: "deactivated" as const,
      message: `Product is tied to ${deps.totalCount} historical subscription(s). Catalog item was deactivated to protect past billing records.`,
    };
  } else {
    await prisma.product.delete({
      where: { id: productId },
    });
    revalidatePath("/products");
    return {
      success: true,
      mode: "deleted" as const,
      message: "Product record has zero historical sales and was permanently deleted.",
    };
  }
}

export async function forceDeleteProductAction(productId: string) {
  await prisma.$transaction([
    prisma.subscription.deleteMany({ where: { productId } }),
    prisma.product.delete({ where: { id: productId } }),
  ]);
  revalidatePath("/products");
  return {
    success: true,
    message: "Product and all associated subscription records were permanently deleted.",
  };
}

/* ==========================================================================
   PROFILE DEPENDENCIES & ACTIONS
   ========================================================================== */

export async function checkProfileDependencies(profileId: string) {
  const [activeSubscriptions, totalSubscriptions] = await Promise.all([
    prisma.subscription.count({
      where: { profileId, status: "Active" },
    }),
    prisma.subscription.count({
      where: { profileId },
    }),
  ]);

  return {
    hasActiveSubscriptions: activeSubscriptions > 0,
    hasHistory: totalSubscriptions > 0,
    activeCount: activeSubscriptions,
    totalCount: totalSubscriptions,
  };
}

export async function deleteOrDeactivateProfileAction(profileId: string) {
  const deps = await checkProfileDependencies(profileId);

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { masterAccountId: true },
  });

  if (deps.hasHistory) {
    await prisma.profile.update({
      where: { id: profileId },
      data: { isActive: false },
    });
    revalidatePath("/accounts");
    if (profile) revalidatePath(`/accounts/${profile.masterAccountId}`);
    return {
      success: true,
      mode: "deactivated" as const,
      message: `Profile has ${deps.totalCount} recorded subscription(s). Slot was marked inactive instead of deleted.`,
    };
  } else {
    await prisma.profile.delete({
      where: { id: profileId },
    });
    revalidatePath("/accounts");
    if (profile) revalidatePath(`/accounts/${profile.masterAccountId}`);
    return {
      success: true,
      mode: "deleted" as const,
      message: "Profile has zero historical assignments and was permanently deleted.",
    };
  }
}

export async function forceDeleteProfileAction(profileId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { masterAccountId: true },
  });

  await prisma.$transaction([
    prisma.subscription.deleteMany({ where: { profileId } }),
    prisma.profile.delete({ where: { id: profileId } }),
  ]);

  revalidatePath("/accounts");
  if (profile) revalidatePath(`/accounts/${profile.masterAccountId}`);

  return {
    success: true,
    message: "Profile slot and all associated subscriptions were permanently deleted.",
  };
}

/* ==========================================================================
   MASTER ACCOUNT DEPENDENCIES & ACTIONS
   ========================================================================== */

export async function checkMasterAccountDependencies(accountId: string) {
  const profiles = await prisma.profile.findMany({
    where: { masterAccountId: accountId },
    select: { id: true },
  });

  const profileIds = profiles.map((p) => p.id);

  const [activeSubscriptions, totalSubscriptions] = await Promise.all([
    prisma.subscription.count({
      where: { profileId: { in: profileIds }, status: "Active" },
    }),
    prisma.subscription.count({
      where: { profileId: { in: profileIds } },
    }),
  ]);

  return {
    profilesCount: profiles.length,
    hasActiveSubscriptions: activeSubscriptions > 0,
    hasHistory: totalSubscriptions > 0,
    activeCount: activeSubscriptions,
    totalCount: totalSubscriptions,
  };
}

export async function deleteOrDeactivateMasterAccountAction(accountId: string) {
  const deps = await checkMasterAccountDependencies(accountId);

  if (deps.hasHistory) {
    await prisma.$transaction([
      prisma.masterAccount.update({
        where: { id: accountId },
        data: { isActive: false },
      }),
      prisma.profile.updateMany({
        where: { masterAccountId: accountId },
        data: { isActive: false },
      }),
    ]);
    revalidatePath("/accounts");
    revalidatePath(`/accounts/${accountId}`);
    return {
      success: true,
      mode: "deactivated" as const,
      message: `Master Account has ${deps.totalCount} historical subscription(s) across its profiles. Account and slots were deactivated.`,
    };
  } else {
    await prisma.masterAccount.delete({
      where: { id: accountId },
    });
    revalidatePath("/accounts");
    return {
      success: true,
      mode: "deleted" as const,
      message: "Master Account has zero historical assignments and was permanently deleted.",
    };
  }
}

export async function forceDeleteMasterAccountAction(accountId: string) {
  const profiles = await prisma.profile.findMany({
    where: { masterAccountId: accountId },
    select: { id: true },
  });

  const profileIds = profiles.map((p) => p.id);

  await prisma.$transaction([
    prisma.subscription.deleteMany({ where: { profileId: { in: profileIds } } }),
    prisma.profile.deleteMany({ where: { masterAccountId: accountId } }),
    prisma.masterAccount.delete({ where: { id: accountId } }),
  ]);

  revalidatePath("/accounts");
  return {
    success: true,
    message: "Master account, profile slots, and linked subscriptions were permanently deleted.",
  };
}
