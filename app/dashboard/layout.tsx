import { MemberArea } from "@/components/layout/MemberArea";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MemberArea>{children}</MemberArea>;
}
