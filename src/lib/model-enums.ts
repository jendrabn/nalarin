import {
  answerGradingStatusValues,
  contentStatusValues,
  genderValues,
  gradingSourceValues,
  navigationModeValues,
  paymentGatewayValues,
  paymentMethodValues,
  paymentStatusValues,
  practiceModeValues,
  questionDifficultyValues,
  questionTypeValues,
  scoringRuleValues,
  sessionStatusValues,
  subscriptionSourceValues,
  subscriptionStatusValues,
  transactionSourceValues,
  userRoleValues,
  userStatusValues,
} from "@/db/schema"

export type EnumBadgeTone =
  | "primary"
  | "secondary"
  | "accent"
  | "muted"
  | "destructive"
  | "chart1"
  | "chart2"
  | "chart3"
  | "chart4"
  | "chart5"

const enumBadgeToneClasses: Record<EnumBadgeTone, string> = {
  primary: "border-primary/20 bg-primary/10 text-primary",
  secondary: "border-secondary/30 bg-secondary text-secondary-foreground",
  accent: "border-accent/30 bg-accent text-accent-foreground",
  muted: "border-border bg-muted text-foreground",
  destructive: "border-destructive/20 bg-destructive/10 text-destructive",
  chart1: "border-chart-1/20 bg-chart-1/10 text-chart-1",
  chart2: "border-chart-2/20 bg-chart-2/10 text-chart-2",
  chart3: "border-chart-3/20 bg-chart-3/10 text-chart-3",
  chart4: "border-chart-4/20 bg-chart-4/10 text-chart-4",
  chart5: "border-chart-5/20 bg-chart-5/10 text-chart-5",
}

type EnumDefinition<Values extends readonly string[]> = {
  values: Values
  labels: Record<Values[number], string>
  tones: Record<Values[number], EnumBadgeTone>
}

function createEnumDefinition<const Values extends readonly string[]>(
  values: Values,
  labels: Record<Values[number], string>,
  tones: Record<Values[number], EnumBadgeTone>,
): EnumDefinition<Values> {
  return {
    values,
    labels,
    tones,
  }
}

export const modelEnums = {
  userRole: createEnumDefinition(
    userRoleValues,
    {
      user: "User",
      admin: "Admin",
    },
    {
      user: "secondary",
      admin: "chart4",
    },
  ),
  userStatus: createEnumDefinition(
    userStatusValues,
    {
      active: "Active",
      inactive: "Inactive",
      suspended: "Suspended",
    },
    {
      active: "chart2",
      inactive: "muted",
      suspended: "destructive",
    },
  ),
  gender: createEnumDefinition(
    genderValues,
    {
      male: "Male",
      female: "Female",
    },
    {
      male: "chart1",
      female: "chart5",
    },
  ),
  questionType: createEnumDefinition(
    questionTypeValues,
    {
      multiple_choice: "Multiple Choice",
      multiple_answer: "Multiple Answer",
      short_answer: "Short Answer",
      true_false: "True / False",
    },
    {
      multiple_choice: "chart1",
      multiple_answer: "chart2",
      short_answer: "chart3",
      true_false: "chart4",
    },
  ),
  questionDifficulty: createEnumDefinition(
    questionDifficultyValues,
    {
      easy: "Easy",
      medium: "Medium",
      hard: "Hard",
    },
    {
      easy: "chart2",
      medium: "chart3",
      hard: "chart4",
    },
  ),
  scoringRule: createEnumDefinition(
    scoringRuleValues,
    {
      all_or_nothing: "All or Nothing",
      partial: "Partial",
    },
    {
      all_or_nothing: "chart4",
      partial: "chart2",
    },
  ),
  contentStatus: createEnumDefinition(
    contentStatusValues,
    {
      draft: "Draft",
      published: "Published",
      archived: "Archived",
    },
    {
      draft: "chart1",
      published: "chart2",
      archived: "muted",
    },
  ),
  sessionStatus: createEnumDefinition(
    sessionStatusValues,
    {
      pending: "Pending",
      in_progress: "In Progress",
      submitted: "Submitted",
      grading: "Grading",
      graded: "Graded",
      cancelled: "Cancelled",
    },
    {
      pending: "chart3",
      in_progress: "chart1",
      submitted: "chart2",
      grading: "chart4",
      graded: "chart2",
      cancelled: "destructive",
    },
  ),
  practiceMode: createEnumDefinition(
    practiceModeValues,
    {
      practice: "Practice",
      quiz: "Quiz",
    },
    {
      practice: "chart1",
      quiz: "chart2",
    },
  ),
  navigationMode: createEnumDefinition(
    navigationModeValues,
    {
      free: "Free",
      sequential: "Sequential",
    },
    {
      free: "secondary",
      sequential: "chart3",
    },
  ),
  answerGradingStatus: createEnumDefinition(
    answerGradingStatusValues,
    {
      not_required: "Not Required",
      pending: "Pending",
      graded: "Graded",
      needs_review: "Needs Review",
    },
    {
      not_required: "muted",
      pending: "chart3",
      graded: "chart2",
      needs_review: "destructive",
    },
  ),
  gradingSource: createEnumDefinition(
    gradingSourceValues,
    {
      manual: "Manual",
      ai: "AI",
      auto: "Auto",
    },
    {
      manual: "chart1",
      ai: "chart2",
      auto: "chart5",
    },
  ),
  paymentStatus: createEnumDefinition(
    paymentStatusValues,
    {
      pending: "Pending",
      paid: "Paid",
      failed: "Failed",
      expired: "Expired",
      cancelled: "Cancelled",
      refunded: "Refunded",
    },
    {
      pending: "chart3",
      paid: "chart2",
      failed: "destructive",
      expired: "muted",
      cancelled: "chart4",
      refunded: "chart1",
    },
  ),
  paymentGateway: createEnumDefinition(
    paymentGatewayValues,
    {
      midtrans: "Midtrans",
      manual: "Manual",
    },
    {
      midtrans: "chart1",
      manual: "secondary",
    },
  ),
  paymentMethod: createEnumDefinition(
    paymentMethodValues,
    {
      bank_transfer: "Bank Transfer",
      e_wallet: "E-Wallet",
      qris: "QRIS",
      credit_card: "Credit Card",
      convenience_store: "Convenience Store",
      manual_transfer: "Manual Transfer",
      other: "Other",
    },
    {
      bank_transfer: "chart1",
      e_wallet: "chart2",
      qris: "chart3",
      credit_card: "chart4",
      convenience_store: "chart5",
      manual_transfer: "secondary",
      other: "muted",
    },
  ),
  transactionSource: createEnumDefinition(
    transactionSourceValues,
    {
      midtrans_webhook: "Midtrans Webhook",
      user_checkout: "User Checkout",
      admin_manual: "Admin Manual",
    },
    {
      midtrans_webhook: "chart1",
      user_checkout: "chart2",
      admin_manual: "chart4",
    },
  ),
  subscriptionStatus: createEnumDefinition(
    subscriptionStatusValues,
    {
      active: "Active",
      expired: "Expired",
      cancelled: "Cancelled",
    },
    {
      active: "chart2",
      expired: "muted",
      cancelled: "destructive",
    },
  ),
  subscriptionSource: createEnumDefinition(
    subscriptionSourceValues,
    {
      midtrans: "Midtrans",
      manual: "Manual",
      admin_grant: "Admin Grant",
    },
    {
      midtrans: "chart1",
      manual: "secondary",
      admin_grant: "chart4",
    },
  ),
} as const

export type ModelEnumName = keyof typeof modelEnums
export type ModelEnumValue<Name extends ModelEnumName> =
  (typeof modelEnums)[Name]["values"][number]

export function getModelEnumBadgeMeta<Name extends ModelEnumName>(
  name: Name,
  value: ModelEnumValue<Name>,
) {
  const definition = modelEnums[name]
  const key = value as keyof typeof definition.labels

  return {
    label: definition.labels[key],
    className: enumBadgeToneClasses[definition.tones[key]],
  }
}

export {
  enumBadgeToneClasses,
  type EnumDefinition,
}
