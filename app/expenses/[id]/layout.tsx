import Header from "@/components/header";
import { ErrorBoundary } from "@/components/error-boundary";

export default function ExpenseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-20">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  );
}
