import { PageHeader } from "@/components/page-header"
import {
  BookOpenCheckIcon,
  BookOpenIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  CreditCardIcon,
  FileQuestionIcon,
  Clock3Icon,
  PercentIcon,
  TrophyIcon,
  UsersRoundIcon,
} from "lucide-react"

import type { AdminDashboardData } from "../queries"
import { formatCurrency, formatInteger, formatPercent, formatScore } from "../utils/format"
import { DashboardChartsSection } from "./dashboard-chart-tabs"
import { DashboardMetricCard } from "./dashboard-metric-card"
import { DashboardQuickActions } from "./dashboard-quick-actions"

type AdminDashboardPageProps = {
  data: AdminDashboardData
}

export function AdminDashboardPage({ data }: AdminDashboardPageProps) {
  const { summary } = data

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        subtitle="Keep an eye on learning activity, payments, subscriptions, and content operations across Nalarin.id."
      />

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title="Total Users"
          description="All platform accounts grouped by current status."
          value={formatInteger(summary.users.total)}
          icon={UsersRoundIcon}
          accent="blue"
          detailItems={[
            { label: "Active", value: formatInteger(summary.users.active) },
            { label: "Inactive", value: formatInteger(summary.users.inactive) },
            { label: "Suspended", value: formatInteger(summary.users.suspended) },
          ]}
        />
        <DashboardMetricCard
          title="Active Subscriptions"
          description="Live exam-type packages currently in use."
          value={formatInteger(summary.subscriptions.activeSubscriptions)}
          icon={CheckCircle2Icon}
          accent="cyan"
          detailItems={[
            { label: "Subscribed users", value: formatInteger(summary.subscriptions.subscribedUsers) },
            { label: "Users without package", value: formatInteger(summary.subscriptions.freeUsers) },
            { label: "Exam types", value: formatInteger(summary.subscriptions.activeExamTypes) },
          ]}
        />
        <DashboardMetricCard
          title="Monthly Revenue"
          description="Revenue collected this month by payment channel."
          value={formatCurrency(summary.payments.currentMonthRevenue)}
          icon={CreditCardIcon}
          accent="indigo"
          detailItems={[
            { label: "Midtrans", value: formatCurrency(summary.payments.currentMonthMidtrans) },
            { label: "Manual", value: formatCurrency(summary.payments.currentMonthManual) },
          ]}
        />
        <DashboardMetricCard
          title="Pending Payments"
          description="Payments still waiting for settlement or review."
          value={formatInteger(summary.payments.pending)}
          icon={Clock3Icon}
          accent="amber"
          detailItems={[
            { label: "Midtrans", value: formatInteger(summary.payments.pendingMidtrans) },
            { label: "Manual", value: formatInteger(summary.payments.pendingManual) },
          ]}
        />
        <DashboardMetricCard
          title="Practice Sessions"
          description="Practice activity split by mode and session state."
          value={formatInteger(summary.practiceSessions.total)}
          icon={BookOpenCheckIcon}
          accent="emerald"
          detailItems={[
            { label: "Practice mode", value: formatInteger(summary.practiceSessions.practiceMode) },
            { label: "Quiz mode", value: formatInteger(summary.practiceSessions.quizMode) },
            { label: "In progress", value: formatInteger(summary.practiceSessions.inProgress) },
            { label: "Graded", value: formatInteger(summary.practiceSessions.graded) },
          ]}
        />
        <DashboardMetricCard
          title="Tryout Sessions"
          description="Tryout sessions moving through the full lifecycle."
          value={formatInteger(summary.tryoutSessions.total)}
          icon={TrophyIcon}
          accent="violet"
          detailItems={[
            { label: "In progress", value: formatInteger(summary.tryoutSessions.inProgress) },
            { label: "Submitted", value: formatInteger(summary.tryoutSessions.submitted) },
            { label: "Graded", value: formatInteger(summary.tryoutSessions.graded) },
            { label: "Cancelled", value: formatInteger(summary.tryoutSessions.cancelled) },
          ]}
        />
        <DashboardMetricCard
          title="Completion Rate"
          description="How many sessions reach grading after completion."
          value={formatPercent(summary.learning.completionRate)}
          icon={PercentIcon}
          accent="sky"
          progress={{
            label: "Completion",
            value: summary.learning.completionRate,
          }}
        />
        <DashboardMetricCard
          title="Average Score / Accuracy"
          description="Overall performance across graded learning sessions."
          value={formatScore(summary.learning.averageScore)}
          icon={BarChart3Icon}
          accent="teal"
          secondaryMetric={{
            label: "Accuracy",
            value: formatPercent(summary.learning.accuracy),
          }}
          detailItems={[
            { label: "Graded sessions", value: formatInteger(summary.learning.gradedSessions) },
            { label: "Total questions", value: formatInteger(summary.learning.totalQuestions) },
          ]}
        />
        <DashboardMetricCard
          title="Total Questions"
          description="Question bank size and publishing status."
          value={formatInteger(summary.content.questions.total)}
          icon={FileQuestionIcon}
          accent="blue"
          detailItems={[
            { label: "Draft", value: formatInteger(summary.content.questions.draft) },
            { label: "Published", value: formatInteger(summary.content.questions.published) },
            { label: "Archived", value: formatInteger(summary.content.questions.archived) },
          ]}
        />
        <DashboardMetricCard
          title="Total Practices"
          description="Practice content counts by publication status."
          value={formatInteger(summary.content.practices.total)}
          icon={BookOpenIcon}
          accent="cyan"
          detailItems={[
            { label: "Draft", value: formatInteger(summary.content.practices.draft) },
            { label: "Published", value: formatInteger(summary.content.practices.published) },
            { label: "Archived", value: formatInteger(summary.content.practices.archived) },
          ]}
        />
        <DashboardMetricCard
          title="Total Tryouts"
          description="Tryout content counts by publication status."
          value={formatInteger(summary.content.tryouts.total)}
          icon={TrophyIcon}
          accent="indigo"
          detailItems={[
            { label: "Draft", value: formatInteger(summary.content.tryouts.draft) },
            { label: "Published", value: formatInteger(summary.content.tryouts.published) },
            { label: "Archived", value: formatInteger(summary.content.tryouts.archived) },
          ]}
        />
      </section>

      <DashboardChartsSection charts={data.charts} />

      <DashboardQuickActions />
    </div>
  )
}
