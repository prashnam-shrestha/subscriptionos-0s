"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createCustomer(formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!fullName || !phone) {
    return { error: "Full Name and Phone Number are required." };
  }

  const existingCustomer = await prisma.customer.findUnique({
    where: { phone },
  });

  if (existingCustomer) {
    return { error: "A customer with this phone number already exists." };
  }

  try {
    await prisma.customer.create({
      data: {
        fullName,
        phone,
        notes,
      },
    });

    revalidatePath("/customers");
    return { success: true };
  } catch {
    return { error: "Failed to create customer. Please try again." };
  }
}

export async function updateCustomer(id: string, formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!fullName || !phone) {
    return { error: "Full Name and Phone Number are required." };
  }

  const existingCustomer = await prisma.customer.findFirst({
    where: {
      phone,
      NOT: { id },
    },
  });

  if (existingCustomer) {
    return { error: "Another customer is already registered with this phone number." };
  }

  try {
    await prisma.customer.update({
      where: { id },
      data: { fullName, phone, notes },
    });

    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    return { success: true };
  } catch {
    return { error: "Failed to update customer." };
  }
}

export async function toggleCustomerStatus(id: string, currentStatus: boolean) {
  try {
    await prisma.customer.update({
      where: { id },
      data: { isActive: !currentStatus },
    });

    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    return { success: true };
  } catch {
    return { error: "Failed to update customer status." };
  }
}