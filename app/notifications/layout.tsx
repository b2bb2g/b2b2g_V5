import { MemberArea } from "@/components/layout/MemberArea";

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MemberArea>{children}</MemberArea>;
}
