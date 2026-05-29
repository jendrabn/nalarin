import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Create User",
  description: "Create a user.",
}

export default function Page() {
  redirect("/admin/users")
}

