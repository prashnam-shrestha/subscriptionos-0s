import { prisma } from "../lib/db";
import { encrypt } from "../lib/encryption";
import { formatCredentialMessage } from "../lib/whatsapp";
import { markProfileNotifiedAction } from "../app/(app)/accounts/actions";

async function runSprint2Tests() {
  console.log("\n🧪 Running Sprint 2 Integration Verification Tests...\n");

  const uniquePhone = `+97798${Date.now().toString().slice(-8)}`;

  // 1. Create test customer, product, master account, profile, subscription
  const customer = await prisma.customer.create({
    data: {
      fullName: "Test Sprint2 User",
      phone: uniquePhone,
    },
  });

  const product = await prisma.product.create({
    data: {
      name: "Netflix Premium Test",
      category: "Netflix",
      price: 500,
      durationDays: 30,
    },
  });

  const masterAccount = await prisma.masterAccount.create({
    data: {
      nickname: "Sprint2 Netflix Account",
      category: "Netflix",
      loginEmail: "sprint2@test.com",
      encryptedPassword: encrypt("sprint2pass"),
    },
  });

  const profile = await prisma.profile.create({
    data: {
      masterAccountId: masterAccount.id,
      profileName: "Profile A",
      capacity: 1,
      encryptedPin: encrypt("4321"),
      needsRenotify: true,
    },
  });

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);

  const subscription = await prisma.subscription.create({
    data: {
      customerId: customer.id,
      productId: product.id,
      profileId: profile.id,
      amountPaid: 500,
      expiryDate: expiry,
      status: "Active",
    },
  });

  // 2. Verify Netflix Formatting (PIN included, Password omitted)
  const netflixMsg = formatCredentialMessage({
    serviceName: masterAccount.nickname,
    category: masterAccount.category,
    loginEmail: masterAccount.loginEmail,
    encryptedPassword: masterAccount.encryptedPassword,
    profileName: profile.profileName,
    encryptedPin: profile.encryptedPin,
    expiryDate: subscription.expiryDate,
  });

  console.log("Generated Netflix Credential Message:\n", netflixMsg);

  if (!netflixMsg.includes("Sprint2 Netflix Account") || !netflixMsg.includes("4321") || netflixMsg.includes("sprint2pass")) {
    throw new Error("❌ Netflix formatting error: PIN should be present and password omitted.");
  }
  console.log("✅ Netflix Credential Message Formatted Correctly.");

  // 3. Verify General Category Formatting (Password & Email included)
  const generalMsg = formatCredentialMessage({
    serviceName: "General Account",
    category: "General",
    loginEmail: "general@test.com",
    encryptedPassword: encrypt("genpass"),
    profileName: "Profile B",
    encryptedPin: profile.encryptedPin,
    expiryDate: subscription.expiryDate,
  });

  if (!generalMsg.includes("general@test.com") || !generalMsg.includes("genpass") || !generalMsg.includes("4321")) {
    throw new Error("❌ General category formatting error: Email, password, and PIN should all be present.");
  }
  console.log("✅ General Credential Message Formatted Correctly.");

  // 4. Test markProfileNotifiedAction
  const actionResult = await markProfileNotifiedAction(profile.id);
  if (!actionResult.success) {
    throw new Error(`❌ Action failed: ${actionResult.error}`);
  }

  const updatedProfile = await prisma.profile.findUnique({
    where: { id: profile.id },
  });

  if (updatedProfile?.needsRenotify !== false) {
    throw new Error("❌ Profile needsRenotify was not set to false!");
  }
  console.log("✅ markProfileNotifiedAction updated needsRenotify to false successfully.");

  // Cleanup
  await prisma.subscription.delete({ where: { id: subscription.id } });
  await prisma.profile.delete({ where: { id: profile.id } });
  await prisma.masterAccount.delete({ where: { id: masterAccount.id } });
  await prisma.product.delete({ where: { id: product.id } });
  await prisma.customer.delete({ where: { id: customer.id } });

  console.log("\n🎉 ALL SPRINT 2 TESTS PASSED PERFECTLY!\n");
}

runSprint2Tests().catch((e) => {
  console.error(e);
  process.exit(1);
});
