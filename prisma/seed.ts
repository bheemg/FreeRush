import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Optional demo data. Idempotent: safe to run repeatedly. Creates a demo account
// (demo@freerush.local / freerush123) with a workspace so you can log in instantly.
const prisma = new PrismaClient();

async function main() {
  const email = "demo@freerush.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Demo user already exists, skipping.");
    return;
  }
  await prisma.user.create({
    data: {
      email,
      name: "Demo",
      passwordHash: await bcrypt.hash("freerush123", 10),
      memberships: {
        create: { role: "OWNER", workspace: { create: { name: "Demo Workspace", slug: "demo" } } },
      },
    },
  });
  console.log("Seeded demo user:", email, "/ freerush123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
