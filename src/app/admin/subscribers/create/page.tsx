import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Create Subscriber",
  description: "Create a subscription record for a user and exam type.",
}

export default function Page() {
  redirect("/admin/payments")
}

