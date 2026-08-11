import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const staffPassword = await bcrypt.hash("staff123", 10);

  await prisma.user.upsert({
    where: { email: "admin@subscriptionos.com" },
    update: {},
    create: {
      email: "admin@subscriptionos.com",
      name: "Admin User",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "staff@subscriptionos.com" },
    update: {},
    create: {
      email: "staff@subscriptionos.com",
      name: "Staff User",
      passwordHash: staffPassword,
      role: Role.STAFF,
    },
  });

  console.log("Database successfully seeded with default users.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
