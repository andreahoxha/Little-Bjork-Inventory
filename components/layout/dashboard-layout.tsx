import { Sidebar } from "./sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: { name: string; email: string; role: string } | null;
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <main className="flex-1 min-w-0 lg:pl-0 pt-0">{children}</main>
    </div>
  );
}
