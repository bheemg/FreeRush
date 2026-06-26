"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { slugify } from "@/lib/utils";
import { signIn } from "@/server/auth";
import { AuthError } from "next-auth";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  workspaceName: z.string().min(2, "Give your workspace a name"),
});

export type ActionState = { error?: string } | undefined;

// Creates the user, their first workspace, and an OWNER membership in one
// transaction, then signs them in. This is the single onboarding entry point.
export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    workspaceName: formData.get("workspaceName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { email, password, workspaceName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists" };

  const passwordHash = await bcrypt.hash(password, 10);
  const baseSlug = slugify(workspaceName) || "workspace";
  let slug = baseSlug;
  for (let i = 1; await prisma.workspace.findUnique({ where: { slug } }); i++) {
    slug = `${baseSlug}-${i}`;
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      memberships: {
        create: {
          role: "OWNER",
          workspace: { create: { name: workspaceName, slug } },
        },
      },
    },
  });

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
}

// Sign in an existing user. next-auth throws a redirect on success (let it
// propagate); only credential errors are surfaced back to the form.
export async function logIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Invalid email or password" };
    throw err;
  }
}
