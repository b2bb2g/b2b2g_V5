import { MemberArea } from "@/components/layout/MemberArea";

// The write flow is part of the member area: same tabs, same frame.
// File uploads steer out of in-app browsers (PRD 13).
export default function WriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MemberArea>{children}</MemberArea>;
}
