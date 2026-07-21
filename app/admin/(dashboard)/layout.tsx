import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-dvh bg-[#faf9fb]">
      <AdminNav />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</div>
    </div>
  );
}
