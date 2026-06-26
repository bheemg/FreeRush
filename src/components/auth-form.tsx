"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { ActionState } from "@/server/auth/actions";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

export function AuthForm({ mode, action }: { mode: "login" | "signup"; action: Action }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined);
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
      {isSignup && (
        <div className="space-y-1.5">
          <Label htmlFor="workspaceName">Workspace name</Label>
          <Input id="workspaceName" name="workspaceName" placeholder="My Agency" required />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" minLength={8} required />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to FreeRush?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
