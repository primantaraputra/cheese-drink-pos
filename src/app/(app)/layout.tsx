import { getCurrentUserProfile } from "@/actions/auth.actions";
import { getActiveShiftAction } from "@/actions/order.actions";
import { Topbar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();
  const activeShift = await getActiveShiftAction();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-stone-50 dark:bg-stone-950">
      <Topbar user={profile} activeShift={activeShift} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={profile?.role} />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <BottomNav role={profile?.role} />
    </div>
  );
}
