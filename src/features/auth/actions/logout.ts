"use server";

import { redirect } from "next/navigation";

import { revokeCurrentSession } from "@/features/auth/services/session";

export async function logoutAction() {
  await revokeCurrentSession();
  redirect("/");
}
