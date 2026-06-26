"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/prisma";
import { requireContext } from "@/server/auth/context";
import { GOOGLE_PROVIDER } from "@/server/integrations/google";

export async function disconnectGoogle() {
  const ctx = await requireContext();
  await prisma.integration.deleteMany({
    where: { workspaceId: ctx.workspaceId, provider: GOOGLE_PROVIDER },
  });
  revalidatePath("/dashboard/settings");
}
