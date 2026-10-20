import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.mustChangePassword) redirect("/change-password");
  return children;
}
