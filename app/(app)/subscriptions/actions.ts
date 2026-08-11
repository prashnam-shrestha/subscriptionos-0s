"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { generateEasyPin } from "../accounts/actions";
import { encrypt, decrypt } from "@/lib/encryption";
import { formatMasterAccountLoginMessage, formatProfileCredentialMessage, formatCredentialMessage } from "@/lib/whatsapp";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { Role } from "@prisma/client";

async function getRoleFromSession(): Promise<Role | null> {
  const session = await auth();
  return (session?.user as any)?.role || null;
}

export async function createSubscriptionAction(formData: FormData) {
  const userRole = await getRoleFromSession();
  if (!hasPermission(userRole, "MANAGE_SUBSCRIPTIONS")) {
    return { error: "Unauthorized: Only Admins/Staff can create subscriptions." };
  }

  const customerId = formData.get("customerId") as string;
  const productId = formData.get("productId") as string;
  const profileId = formData.get("profileId") as string;
  const durationDaysStr = formData.get("durationDays") as string;

  if (!customerId || !productId || !profileId) {
    return { error: "Customer, Product, and Profile are required." };
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "Product not found." };

  const profile = await prisma.profile.findUnique({ 
    where: { id: profileId },
    include: { masterAccount: true }
  });
  if (!profile) return { error: "Profile not found." };

  const durationDays = durationDaysStr ? parseInt(durationDaysStr, 10) : product.durationDays;
  const startDate = new Date();
  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + durationDays);

  const amountPaid = formData.get("amountPaid")
    ? parseFloat(formData.get("amountPaid") as string)
    : product.price;

  const sub = await prisma.subscription.create({
    data: {
      amountPaid,
      customerId,
      productId,
      profileId,
      startDate,
      expiryDate,
      status: "Active",
    },
    include: { customer: true }
  });

  const loginMessageText = formatMasterAccountLoginMessage({
    customerName: sub.customer.fullName,
    productName: product.name,
    loginEmail: profile.masterAccount.loginEmail,
  });

  const profileMessageText = formatProfileCredentialMessage({
    customerName: sub.customer.fullName,
    profileName: profile.profileName,
    encryptedPin: profile.encryptedPin,
    expiryDate: expiryDate,
  });

  await prisma.task.create({
    data: {
      type: "NOTIFY_NEW_SUBSCRIPTION",
      title: `New Subscription: ${sub.customer.fullName}`,
      description: `Profile: ${profile.profileName} - ${product.name}`,
      relatedEntityId: sub.id,
      metadata: JSON.stringify({
        customerName: sub.customer.fullName,
        phone: sub.customer.phone,
        loginMessageText,
        profileMessageText,
      }),
    }
  });

  revalidatePath("/subscriptions");
  revalidatePath(`/accounts/${profile.masterAccountId}`);
  return { success: true };
}

export async function renewSubscriptionAction(subscriptionId: string, durationDays: number) {
  const userRole = await getRoleFromSession();
  if (!hasPermission(userRole, "MANAGE_SUBSCRIPTIONS")) {
    return { error: "Unauthorized." };
  }

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { profile: true },
  });
  if (!sub) return { error: "Subscription not found." };

  const baseDate = new Date(sub.expiryDate) > new Date() ? new Date(sub.expiryDate) : new Date();
  baseDate.setDate(baseDate.getDate() + durationDays);

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      expiryDate: baseDate,
      status: "Active",
    },
  });

  revalidatePath("/subscriptions");
  if (sub.profile?.masterAccountId) {
    revalidatePath(`/accounts/${sub.profile.masterAccountId}`);
  }
  return { success: true };
}

export async function cancelSubscriptionAction(subscriptionId: string) {
  const userRole = await getRoleFromSession();
  if (!hasPermission(userRole, "MANAGE_SUBSCRIPTIONS")) {
    return { error: "Unauthorized." };
  }

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { profile: true },
  });
  if (!sub) return { error: "Subscription not found." };

  // Seat must be reclaimed first — Active means the profile slot is still attached
  if (sub.status === "Active") {
    return {
      error:
        "Cannot cancel while the profile seat is still attached. Reclaim the seat first.",
    };
  }

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "Cancelled" },
  });

  revalidatePath("/subscriptions");
  if (sub.profile?.masterAccountId) {
    revalidatePath(`/accounts/${sub.profile.masterAccountId}`);
  }
  return { success: true };
}

export async function deleteSubscriptionAction(subscriptionId: string) {
  const userRole = await getRoleFromSession();
  if (!hasPermission(userRole, "MANAGE_SUBSCRIPTIONS")) {
    return { error: "Unauthorized." };
  }

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { profile: true },
  });
  if (!sub) return { error: "Subscription not found." };

  if (sub.status !== "Cancelled") {
    return { error: "Only cancelled subscriptions can be permanently deleted." };
  }

  await prisma.subscription.delete({
    where: { id: subscriptionId },
  });

  revalidatePath("/subscriptions");
  if (sub.profile?.masterAccountId) {
    revalidatePath(`/accounts/${sub.profile.masterAccountId}`);
  }
  return { success: true };
}

export async function moveSubscriptionAction(subscriptionId: string, newProfileId: string) {
  const userRole = await getRoleFromSession();
  if (!hasPermission(userRole, "MANAGE_SUBSCRIPTIONS")) {
    return { error: "Unauthorized." };
  }

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { profile: { include: { masterAccount: true } }, customer: true, product: true },
  });
  if (!sub) return { error: "Subscription not found." };

  const newProfile = await prisma.profile.findUnique({ 
    where: { id: newProfileId },
    include: { masterAccount: true }
  });
  if (!newProfile) return { error: "Target profile not found." };

  const fromMasterAccountId = sub.profile.masterAccountId;
  const toMasterAccountId = newProfile.masterAccountId;
  const sameMasterAccount = fromMasterAccountId === toMasterAccountId;

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { profileId: newProfileId },
  });

  const loginMessageText = formatMasterAccountLoginMessage({
    customerName: sub.customer.fullName,
    productName: sub.product.name,
    loginEmail: newProfile.masterAccount.loginEmail,
  });

  const profileMessageText = formatProfileCredentialMessage({
    customerName: sub.customer.fullName,
    profileName: newProfile.profileName,
    encryptedPin: newProfile.encryptedPin,
    expiryDate: sub.expiryDate,
  });

  await prisma.task.create({
    data: {
      type: "NOTIFY_MIGRATION",
      title: `Migration: ${sub.customer.fullName}`,
      description: `Moved to ${newProfile.masterAccount.nickname} (${newProfile.profileName})`,
      relatedEntityId: sub.id,
      metadata: JSON.stringify({
        customerName: sub.customer.fullName,
        phone: sub.customer.phone,
        loginMessageText,
        profileMessageText,
        fromMasterAccountId,
        toMasterAccountId,
        fromProfileId: sub.profileId,
        toProfileId: newProfileId,
        sameMasterAccount,
      }),
    }
  });

  revalidatePath("/subscriptions");
  if (sub?.profile?.masterAccountId) revalidatePath(`/accounts/${sub.profile.masterAccountId}`);
  revalidatePath(`/accounts/${newProfile.masterAccountId}`);
  return { success: true };
}

export async function addApologyDaysAction(subscriptionId: string, days: number) {
  if (!subscriptionId || days <= 0) return { error: "Invalid parameters." };

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { profile: true },
  });
  if (!sub) return { error: "Subscription not found." };

  const currentExpiry = new Date(sub.expiryDate);
  currentExpiry.setDate(currentExpiry.getDate() + days);

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { expiryDate: currentExpiry },
  });

  revalidatePath("/subscriptions");
  if (sub.profile?.masterAccountId) {
    revalidatePath(`/accounts/${sub.profile.masterAccountId}`);
  }
  return { success: true };
}

export async function reclaimProfileSlotAction(subscriptionId: string, profileId?: string) {
  if (!subscriptionId) return { error: "Subscription ID missing." };

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { profile: true },
  });

  if (!sub) return { error: "Subscription not found." };

  const targetProfileId = profileId || sub.profileId;

  // Detach seat: mark Expired/Unassigned and expire immediately so it no longer occupies capacity
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "Expired",
      expiryDate: new Date(),
    },
  });

  if (targetProfileId) {
    const newPin = await generateEasyPin();
    const encryptedPin = encrypt(newPin);

    const updatedProfile = await prisma.profile.update({
      where: { id: targetProfileId },
      data: {
        encryptedPin,
        needsRenotify: true,
      },
      include: {
        masterAccount: true,
        subscriptions: {
          where: {
            status: "Active",
            id: { not: subscriptionId },
          },
          include: { customer: true, product: true }
        }
      }
    });

    await prisma.task.create({
      data: {
        type: "PHYSICAL_STREAMING_PIN_CHANGE",
        title: `Change PIN for ${updatedProfile.profileName}`,
        description: `Update the PIN in ${updatedProfile.masterAccount.category} to ${newPin}`,
        relatedEntityId: targetProfileId,
        metadata: JSON.stringify({ newPin }),
      }
    });

    for (const activeSub of updatedProfile.subscriptions) {
      const messageText = formatCredentialMessage({
        customerName: activeSub.customer.fullName,
        productName: activeSub.product.name,
        loginEmail: updatedProfile.masterAccount.loginEmail,
        encryptedPassword: updatedProfile.masterAccount.encryptedPassword,
        profileName: updatedProfile.profileName,
        encryptedPin: updatedProfile.encryptedPin,
        expiryDate: activeSub.expiryDate,
      });

      await prisma.task.create({
        data: {
          type: "NOTIFY_PIN_CHANGE",
          title: `Notify ${activeSub.customer.fullName} of new PIN`,
          description: `Profile: ${updatedProfile.profileName} - ${updatedProfile.masterAccount.category}`,
          relatedEntityId: activeSub.id,
          metadata: JSON.stringify({
            customerName: activeSub.customer.fullName,
            phone: activeSub.customer.phone,
            messageText,
          }),
        }
      });
    }
  }

  revalidatePath("/subscriptions");
  if (sub.profile?.masterAccountId) {
    revalidatePath(`/accounts/${sub.profile.masterAccountId}`);
  }
  return { success: true };
}

export async function reclaimSeatAction(subscriptionId: string) {
  return reclaimProfileSlotAction(subscriptionId);
}
