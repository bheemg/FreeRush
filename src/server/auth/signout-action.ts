"use server";

import { signOut } from "@/server/auth";

export async function logOut() {
  await signOut({ redirectTo: "/login" });
}
