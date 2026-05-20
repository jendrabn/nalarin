import Link from "next/link";
import {
  ArrowUpRightIcon,
  BookOpenCheckIcon,
  CreditCardIcon,
  FileQuestionIcon,
  TrophyIcon,
  UsersRoundIcon,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const summaryCards = [
  {
    title: "Users",
    description: "Manage user accounts, account status, and admin access.",
    href: "/admin/users",
    icon: UsersRoundIcon,
  },
  {
    title: "Payments",
    description: "Monitor Midtrans, manual transfers, and payment approvals.",
    href: "/admin/payments",
    icon: CreditCardIcon,
  },
  {
    title: "Questions",
    description: "Build the question bank, import Excel files, and generate with AI.",
    href: "/admin/questions",
    icon: FileQuestionIcon,
  },
  {
    title: "Tryouts",
    description: "Manage multi-section tryouts, sessions, and rankings.",
    href: "/admin/tryouts",
    icon: TrophyIcon,
  },
];

const workflowItems = [
  {
    title: "Practice",
    description: "Practice and quiz modes for the question bank.",
    href: "/admin/practices",
    icon: BookOpenCheckIcon,
  },
];

export default function Page() {
  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="The academic command center for managing users, billing, learning content, tryouts, and blog publishing within the MVP scope."
        actions={
          <Button asChild>
            <Link href="/admin/questions/create">Add Question</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card
            key={item.href}
            className="border border-border/70 bg-card/90 shadow-sm transition-colors hover:border-primary/40"
          >
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
              <CardAction>
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <item.icon />
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href={item.href}>
                  Open
                  <ArrowUpRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {workflowItems.map((item) => (
          <Card key={item.href} className="border border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <item.icon />
                {item.title}
              </CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline-primary" size="sm">
                <Link href={item.href}>Manage {item.title}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
