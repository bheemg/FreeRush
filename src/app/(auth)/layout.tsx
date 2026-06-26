export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold tracking-tight">
            Free<span className="text-primary">Rush</span>
          </div>
          <p className="mt-1 text-sm text-muted">AI-grounded SEO command center</p>
        </div>
        {children}
      </div>
    </div>
  );
}
