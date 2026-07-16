import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const ownerUsername = "owner";
  const ownerPassword = "owner123";

  const existing = await prisma.user.findUnique({ where: { username: ownerUsername } });
  if (existing) {
    console.log(`Authority account already exists: ${ownerUsername}`);
    return;
  }

  const passwordHash = await bcrypt.hash(ownerPassword, 10);

  await prisma.user.create({
    data: {
      username: ownerUsername,
      name: "Owner",
      passwordHash,
      role: "AUTHORITY",
    },
  });

  console.log("Seeded Authority account:");
  console.log(`  username: ${ownerUsername}`);
  console.log(`  password: ${ownerPassword}`);
  console.log("Change this password after first login. Use this account to configure");
  console.log("Settings and create your first Vendor Manager account.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
