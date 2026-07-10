import { MemberArea } from "@/components/layout/MemberArea";

// The write flow is part of the member area: same tabs, same frame.
export default function WriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MemberArea>{children}</MemberArea>;
}
