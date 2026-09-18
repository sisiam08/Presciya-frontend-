import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-black text-on-surface">404</h1>
      <p className="text-sm text-on-surface-variant">
        This page could not be found.
      </p>
      <Link
        href="/dashboard"
        className="text-sm font-semibold text-primary hover:underline"
      >
        Go to dashboard
      </Link>
    </div>
  );
}
