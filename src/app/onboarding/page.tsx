import Link from "next/link";

// Edge case: a signed-in user without a workspace. Normal signup always creates
// one, so this is just a safe landing spot.
export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-xl font-semibold">No workspace found</h1>
        <p className="mt-2 text-sm text-muted">Your account isn&apos;t attached to a workspace yet.</p>
        <Link href="/signup" className="mt-4 inline-block text-primary hover:underline">
          Create one →
        </Link>
      </div>
    </div>
  );
}
