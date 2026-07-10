import { MemberArea } from "@/components/layout/MemberArea";

export default function InquiriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MemberArea>{children}</MemberArea>;
}
