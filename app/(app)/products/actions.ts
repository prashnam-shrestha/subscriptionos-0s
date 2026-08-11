"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData): Promise<{ error: string | null }> {
  try {
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const durationDays = parseInt(formData.get("durationDays") as string, 10);
    const price = parseFloat(formData.get("price") as string);

    if (!name || !category || isNaN(durationDays) || isNaN(price)) {
      return { error: "All fields are required and numeric values must be valid." };
    }

    await prisma.product.create({
      data: {
        name,
        category,
        durationDays,
        price,
        isActive: true,
      },
    });

    revalidatePath("/products");
    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred." };
  }
}

export async function toggleProductStatus(id: string, currentStatus: boolean) {
  await prisma.product.update({
    where: { id },
    data: {
      isActive: !currentStatus,
    },
  });

  revalidatePath("/products");
}

export async function updateProductAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const durationDays = parseInt(formData.get("durationDays") as string, 10);
  const price = parseFloat(formData.get("price") as string);
  const isActive = formData.get("isActive") === "true";

  if (!id || !name || !category || isNaN(durationDays) || isNaN(price)) {
    throw new Error("All fields are required and numeric values must be valid.");
  }

  await prisma.product.update({
    where: { id },
    data: {
      name,
      category,
      durationDays,
      price,
      isActive,
    },
  });

  revalidatePath("/products");
}
