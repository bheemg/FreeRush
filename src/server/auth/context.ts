import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

export interface WorkspaceContext {
  userId: string;
  email: string;
  workspaceId: string;
  workspaceName: string;
  role: string;
}

// Resolves the signed-in user and their active workspace (first membership for
// now — a workspace switcher can set a preferred one later). Redirects to login
// when unauthenticated. This is the tenant boundary every dashboard query uses.
export async function requireContext(): Promise<WorkspaceContext> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true, user: true },
    orderBy: { createdAt: "asc" },
  });

  // A signed-in user with no workspace shouldn't happen (signup creates one),
  // but guard anyway by sending them to onboarding.
  if (!membership) redirect("/onboarding");

  return {
    userId: session.user.id,
    email: membership.user.email,
    workspaceId: membership.workspaceId,
    workspaceName: membership.workspace.name,
    role: membership.role,
  };
}
