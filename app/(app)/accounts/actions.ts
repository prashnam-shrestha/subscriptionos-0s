"use server";

import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encryption";
import { formatCredentialMessage, formatMasterAccountLoginMessage } from "@/lib/whatsapp";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { Role } from "@prisma/client";

async function getRoleFromSession(): Promise<Role | null> {
  const session = await auth();
  return (session?.user as any)?.role || null;
}

async function createPhysicalProfileCreationTask(
  masterAccount: { id: string; nickname: string; category: string },
  profileId: string,
  profileName: string,
  rawPin: string
) {
  await prisma.task.create({
    data: {
      type: "PHYSICAL_PROFILE_CREATION",
      title: `Create Profile: ${profileName} in ${masterAccount.nickname}`,
      description: `Physically create profile "${profileName}" with PIN ${rawPin} inside ${masterAccount.nickname} on ${masterAccount.category}.`,
      relatedEntityId: profileId,
      metadata: JSON.stringify({
        masterAccountId: masterAccount.id,
        nickname: masterAccount.nickname,
        category: masterAccount.category,
        profileName,
        pin: rawPin,
        masterAccountName: masterAccount.nickname,
        platform: masterAccount.category,
      }),
    },
  });
}

export async function generateEasyPin(usedPins?: Set<string>): Promise<string> {
  const patterns = [
    () => {
      const a = Math.floor(Math.random() * 10);
      let b = Math.floor(Math.random() * 10);
      while (b === a) b = Math.floor(Math.random() * 10);
      return `${a}${a}${a}${b}`;
    },
    () => {
      const a = Math.floor(Math.random() * 10);
      const b = Math.floor(Math.random() * 10);
      return `00${a}${b}`;
    },
    () => {
      const a = Math.floor(Math.random() * 10);
      const b = Math.floor(Math.random() * 10);
      return `${a}${a}${b}${b}`;
    },
    () => {
      const a = Math.floor(Math.random() * 10);
      const b = Math.floor(Math.random() * 10);
      return `${a}${b}${a}${b}`;
    },
  ];

  let pin = "";
  let attempts = 0;

  do {
    const pick = patterns[Math.floor(Math.random() * patterns.length)];
    pin = pick();
    attempts++;
  } while (usedPins && usedPins.has(pin) && attempts < 200);

  return pin;
}

export async function revealSecret(encryptedValue: string) {
  const userRole = await getRoleFromSession();
  if (!hasPermission(userRole, "REVEAL_SECRETS")) {
    throw new Error("Unauthorized: Only Admins can reveal master passwords and PINs.");
  }
  if (!encryptedValue) return "";
  return decrypt(encryptedValue);
}

export async function createMasterAccount(formData: FormData) {
  const userRole = await getRoleFromSession();
  if (!hasPermission(userRole, "MANAGE_MASTER_ACCOUNTS")) {
    return { error: "Unauthorized: Only Admins can create master accounts." };
  }

  const nickname = formData.get("nickname") as string;
  const category = formData.get("category") as string;
  const loginEmail = formData.get("loginEmail") as string;
  const password = formData.get("password") as string;

  if (!nickname || !category || !loginEmail) {
    return { error: "Nickname, Category, and Login Email are required." };
  }

  const encryptedPassword = password && password.trim() !== "" ? encrypt(password.trim()) : "";

  await prisma.masterAccount.create({
    data: {
      nickname,
      category,
      loginEmail,
      encryptedPassword,
      isActive: true,
    },
  });

  try {
    revalidatePath("/accounts");
  } catch {}
  return { error: null };
}

export async function createProfile(
  masterAccountIdOrFormData: string | FormData,
  formDataArg?: FormData
) {
  const userRole = await getRoleFromSession();
  if (!hasPermission(userRole, "MANAGE_PROFILE_SLOTS")) {
    return { error: "Unauthorized: Only Admins can add profile slots." };
  }

  let masterAccountId: string;
  let formData: FormData;

  if (typeof masterAccountIdOrFormData === "string") {
    masterAccountId = masterAccountIdOrFormData;
    formData = formDataArg!;
  } else {
    formData = masterAccountIdOrFormData;
    masterAccountId = formData.get("masterAccountId") as string;
  }

  const profileName = formData.get("profileName") as string;
  const pin = formData.get("pin") as string;
  const capacityStr = formData.get("capacity") as string;

  const capacity = capacityStr ? parseInt(capacityStr, 10) : 1;

  if (!masterAccountId || !profileName) {
    return { error: "Master Account and Profile Name are required." };
  }

  const existingProfiles = await prisma.profile.findMany({
    where: { masterAccountId },
    select: { encryptedPin: true },
  });

  const usedPins = new Set<string>();
  for (const ep of existingProfiles) {
    if (ep.encryptedPin) {
      try {
        const dec = decrypt(ep.encryptedPin);
        if (dec) usedPins.add(dec);
      } catch (_) {}
    }
  }

  const rawPin = pin && pin.trim() !== "" ? pin.trim() : await generateEasyPin(usedPins);
  const encryptedPin = encrypt(rawPin);

  const masterAccount = await prisma.masterAccount.findUnique({
    where: { id: masterAccountId },
    select: { id: true, nickname: true, category: true },
  });
  if (!masterAccount) {
    return { error: "Master account not found." };
  }

  const profile = await prisma.profile.create({
    data: {
      masterAccountId,
      profileName,
      encryptedPin,
      capacity: isNaN(capacity) ? 1 : capacity,
      isActive: true,
    },
  });

  await createPhysicalProfileCreationTask(
    masterAccount,
    profile.id,
    profileName,
    rawPin
  );

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${masterAccountId}`);
  revalidatePath("/tasks");
  return { error: null };
}

export async function bulkCreateProfilesAction(
  masterAccountId: string,
  profiles: Array<{ profileName: string; capacity: number; pin?: string }>
) {
  const userRole = await getRoleFromSession();
  if (!hasPermission(userRole, "MANAGE_PROFILE_SLOTS")) {
    return { error: "Unauthorized: Only Admins can add profile slots." };
  }

  if (!masterAccountId || !profiles || profiles.length === 0) {
    return { error: "Invalid payload or empty profiles list." };
  }

  try {
    const existingProfiles = await prisma.profile.findMany({
      where: { masterAccountId },
      select: { encryptedPin: true },
    });

    const usedPins = new Set<string>();
    for (const ep of existingProfiles) {
      if (ep.encryptedPin) {
        try {
          const dec = decrypt(ep.encryptedPin);
          if (dec) usedPins.add(dec);
        } catch (_) {}
      }
    }

    const masterAccount = await prisma.masterAccount.findUnique({
      where: { id: masterAccountId },
      select: { id: true, nickname: true, category: true },
    });
    if (!masterAccount) {
      return { error: "Master account not found." };
    }

    const profilesWithPins = await Promise.all(
      profiles.map(async (p) => {
        let rawPin = p.pin && p.pin.trim() !== "" ? p.pin.trim() : "";
        if (!rawPin) {
          rawPin = await generateEasyPin(usedPins);
        }
        usedPins.add(rawPin);

        return {
          rawPin,
          data: {
            masterAccountId,
            profileName: p.profileName.trim(),
            encryptedPin: encrypt(rawPin),
            capacity: p.capacity || 2,
            isActive: true,
          },
        };
      })
    );

    const createdProfiles = await prisma.$transaction(
      profilesWithPins.map(({ data }) => prisma.profile.create({ data }))
    );

    for (let i = 0; i < createdProfiles.length; i++) {
      await createPhysicalProfileCreationTask(
        masterAccount,
        createdProfiles[i].id,
        createdProfiles[i].profileName,
        profilesWithPins[i].rawPin
      );
    }

    revalidatePath("/accounts");
    revalidatePath(`/accounts/${masterAccountId}`);
    revalidatePath("/tasks");
    return { error: null };
  } catch (err: any) {
    return { error: err.message || "Failed to bulk generate profiles." };
  }
}

export async function updateMasterAccountAction(formData: FormData) {
  const userRole = await getRoleFromSession();
  if (!hasPermission(userRole, "MANAGE_MASTER_ACCOUNTS")) {
    throw new Error("Unauthorized: Only Admins can modify master accounts.");
  }

  const id = formData.get("id") as string;
  const nickname = formData.get("nickname") as string;
  const category = formData.get("category") as string;
  const loginEmail = formData.get("loginEmail") as string;
  const passwordRaw = formData.get("password") as string;
  const isActive = formData.get("isActive") === "true";

  if (!id || !nickname || !category || !loginEmail) {
    throw new Error("Required fields missing.");
  }

  const updateData: {
    nickname: string;
    category: string;
    loginEmail: string;
    isActive: boolean;
    encryptedPassword?: string;
  } = {
    nickname,
    category,
    loginEmail,
    isActive,
  };

  const existingAccount = await prisma.masterAccount.findUnique({ where: { id } });
  if (!existingAccount) throw new Error("Account not found.");

  const isEmailChanged = existingAccount.loginEmail !== loginEmail;
  const isPasswordChanged = Boolean(passwordRaw && passwordRaw.trim() !== "");

  if (isPasswordChanged) {
    updateData.encryptedPassword = encrypt(passwordRaw.trim());
  }

  await prisma.$transaction(async (tx) => {
    await tx.masterAccount.update({
      where: { id },
      data: updateData,
    });

    if (isPasswordChanged || isEmailChanged) {
      await tx.profile.updateMany({
        where: { masterAccountId: id },
        data: { needsRenotify: true },
      });

      const activeSubs = await tx.subscription.findMany({
        where: { profile: { masterAccountId: id }, status: "Active" },
        include: { customer: true, product: true, profile: { include: { masterAccount: true } } }
      });

      for (const sub of activeSubs) {
        const loginMessageText = formatMasterAccountLoginMessage({
          customerName: sub.customer.fullName,
          productName: sub.product.name,
          loginEmail: sub.profile.masterAccount.loginEmail,
        });

        await tx.task.create({
          data: {
            type: "NOTIFY_CREDENTIAL_CHANGE",
            title: `Notify ${sub.customer.fullName} of new Account Credentials`,
            description: `Account: ${sub.profile.masterAccount.nickname}`,
            relatedEntityId: sub.id,
            metadata: JSON.stringify({
              customerName: sub.customer.fullName,
              phone: sub.customer.phone,
              messageText: loginMessageText,
            }),
          }
        });
      }
    }
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${id}`);
}

export async function updateProfileAction(formData: FormData) {
  const userRole = await getRoleFromSession();
  if (!hasPermission(userRole, "MANAGE_PROFILE_SLOTS")) {
    throw new Error("Unauthorized: Only Admins can modify profile slots.");
  }

  const id = formData.get("id") as string;
  const masterAccountId = formData.get("masterAccountId") as string;
  const profileName = formData.get("profileName") as string;
  const pinRaw = formData.get("pin") as string;
  const capacity = parseInt(formData.get("capacity") as string, 10);
  const isActive = formData.get("isActive") === "true";

  if (!id || !profileName || isNaN(capacity)) {
    throw new Error("Invalid parameters.");
  }

  const activeCount = await prisma.subscription.count({
    where: { profileId: id, status: "Active" },
  });

  if (capacity < activeCount) {
    throw new Error(
      `Cannot reduce capacity to ${capacity}. Profile currently has ${activeCount} active assigned subscription(s).`
    );
  }

  const updateData: {
    profileName: string;
    capacity: number;
    isActive: boolean;
    encryptedPin?: string;
  } = {
    profileName,
    capacity,
    isActive,
  };

  if (pinRaw && pinRaw.trim() !== "") {
    updateData.encryptedPin = encrypt(pinRaw.trim());
  }

  const updatedProfile = await prisma.profile.update({
    where: { id },
    data: updateData,
    include: {
      masterAccount: true,
      subscriptions: {
        where: { status: "Active" },
        include: { customer: true, product: true }
      }
    }
  });

  if (pinRaw && pinRaw.trim() !== "") {
    const newPin = pinRaw.trim();
    
    await prisma.task.create({
      data: {
        type: "PHYSICAL_STREAMING_PIN_CHANGE",
        title: `Change PIN for ${updatedProfile.profileName}`,
        description: `Update the PIN in ${updatedProfile.masterAccount.category} to ${newPin}`,
        relatedEntityId: id,
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

  revalidatePath("/accounts");
  if (masterAccountId) {
    revalidatePath(`/accounts/${masterAccountId}`);
  }
}

export async function markProfileNotifiedAction(profileId: string) {
  try {
    await prisma.profile.update({
      where: { id: profileId },
      data: { needsRenotify: false },
    });
    try {
      revalidatePath("/accounts");
    } catch {}
    return { success: true };
  } catch (error: any) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getMasterAccountHealth(masterAccountId: string) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentTicketCount = await prisma.ticket.count({
    where: {
      masterAccountId,
      createdAt: { gte: sevenDaysAgo },
    },
  });

  const isUnstable = recentTicketCount >= 3;
  return {
    recentTicketCount,
    healthStatus: isUnstable ? ("UNSTABLE" as const) : ("HEALTHY" as const),
  };
}

export async function createTicketAction(formData: FormData) {
  const session = await auth();
  const userRole = (session?.user as any)?.role as Role | undefined;

  if (!hasPermission(userRole, "MANAGE_SUBSCRIPTIONS")) {
    return { error: "Unauthorized to log complaint tickets." };
  }

  const masterAccountId = formData.get("masterAccountId") as string;
  const subscriptionId = (formData.get("subscriptionId") as string) || null;
  const customerId = (formData.get("customerId") as string) || null;
  const issue = formData.get("issue") as string;

  if (!masterAccountId || !issue) {
    return { error: "Master Account and Issue details are required." };
  }

  await prisma.ticket.create({
    data: {
      masterAccountId,
      subscriptionId,
      customerId,
      issue,
      status: "Open",
    },
  });

  revalidatePath(`/accounts/${masterAccountId}`);
  revalidatePath("/accounts");
  return { success: true };
}

export async function resolveTicketAction(ticketId: string, masterAccountId: string) {
  const session = await auth();
  const userRole = (session?.user as any)?.role as Role | undefined;

  if (!hasPermission(userRole, "MANAGE_SUBSCRIPTIONS")) {
    return { error: "Unauthorized to update tickets." };
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "Resolved" },
  });

  revalidatePath(`/accounts/${masterAccountId}`);
  revalidatePath("/accounts");
  return { success: true };
}
