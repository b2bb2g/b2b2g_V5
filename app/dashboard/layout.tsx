import { MemberArea } from "@/components/layout/MemberArea";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MemberArea>{children}</MemberArea>;
}
