import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "admin@subscription.os" },
    update: {},
    create: {
      email: "admin@subscription.os",
      name: "Admin User",
      passwordHash,
    },
  });
  console.log("Seeded default user: admin@subscription.os / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });