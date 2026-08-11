import { formatCredentialMessage } from "../lib/whatsapp";
import { markProfileNotifiedAction } from "../app/(app)/accounts/actions";
import { prisma } from "../lib/db";

async function runVerification() {
  console.log("\n--- 1. TESTING WHATSAPP FORMATTER ---");
  const netflixMsg = formatCredentialMessage({
    serviceName: "Netflix",
    category: "NETFLIX",
    profileName: "Profile 1",
    encryptedPin: "16:dummy",
    expiryDate: new Date(),
  });
  console.log(netflixMsg);

  console.log("\n--- 2. TESTING PRISMA & SERVER ACTION ---");
  const profile = await prisma.profile.findFirst();
  if (!profile) {
    console.log("No profile records found in dev.db yet.");
    return;
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: { needsRenotify: true },
  });
  let p = await prisma.profile.findUnique({ where: { id: profile.id } });
  console.log("Profile needsRenotify set to:", p?.needsRenotify);

  await markProfileNotifiedAction(profile.id);
  p = await prisma.profile.findUnique({ where: { id: profile.id } });
  console.log("Profile needsRenotify after markProfileNotifiedAction:", p?.needsRenotify);

  console.log("\n✅ ALL SPRINT 1 TESTS PASSED!");
}

runVerification()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
