import { prisma } from "@/lib/db";

export async function assignProfileAndCreateSubscription({
  customerId,
  productId,
  amountPaid,
}: {
  customerId: string;
  productId: string;
  amountPaid: number;
}) {
  // 1. Fetch Product
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || !product.isActive) {
    return { error: "Selected product is invalid or inactive." };
  }

  // 2. Fetch Active Profiles under Active Master Accounts matching Product Category
  const candidateProfiles = await prisma.profile.findMany({
    where: {
      isActive: true,
      masterAccount: {
        isActive: true,
        category: product.category,
      },
    },
    include: {
      subscriptions: {
        where: { status: "Active" },
      },
    },
  });

  if (candidateProfiles.length === 0) {
    return {
      error: `No available profile for this product category (${product.category}) — add a new Master Account or Profile first.`,
    };
  }

  // 3. Filter profiles where current Active subscription count < capacity
  const availableProfiles = candidateProfiles
    .map((profile) => ({
      profile,
      activeCount: profile.subscriptions.length,
      spareCapacity: profile.capacity - profile.subscriptions.length,
    }))
    .filter((item) => item.spareCapacity > 0);

  if (availableProfiles.length === 0) {
    return {
      error: `No available profile for this product — all profile slots in category "${product.category}" are at full capacity. Add a new Master Account or Profile first.`,
    };
  }

  // 4. Lowest occupancy first rule (sort by activeCount ascending)
  availableProfiles.sort((a, b) => a.activeCount - b.activeCount);

  const selectedProfile = availableProfiles[0].profile;

  // 5. Calculate expiry date
  const startDate = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(startDate.getDate() + product.durationDays);

  // 6. Create Subscription inside a Database Transaction
  try {
    const subscription = await prisma.$transaction(async (tx) => {
      return await tx.subscription.create({
        data: {
          customerId,
          productId,
          profileId: selectedProfile.id,
          startDate,
          expiryDate,
          amountPaid,
          status: "Active",
        },
      });
    });

    return { success: true, subscriptionId: subscription.id };
  } catch {
    return { error: "Failed to allocate subscription slot. Please try again." };
  }
}