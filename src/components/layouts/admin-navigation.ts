import type { LucideIcon } from "lucide-react"
import {
  BookOpenCheckIcon,
  BookTextIcon,
  CreditCardIcon,
  FileQuestionIcon,
  FileTextIcon,
  FolderTreeIcon,
  GraduationCapIcon,
  HomeIcon,
  LibraryBigIcon,
  NewspaperIcon,
  TagsIcon,
  TicketPercentIcon,
  TrophyIcon,
  UserRoundCheckIcon,
  UsersRoundIcon,
} from "lucide-react"

export type AdminNavigationItem = {
  title: string
  href: string
  icon: LucideIcon
  description?: string
}

export type AdminNavigationGroup = {
  title: string
  items: AdminNavigationItem[]
}

export const adminNavigationGroups: AdminNavigationGroup[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/admin",
        icon: HomeIcon,
        description: "Platform activity overview",
      },
    ],
  },
  {
    title: "User & Billing",
    items: [
      {
        title: "Users",
        href: "/admin/users",
        icon: UsersRoundIcon,
        description: "Manage user accounts and status",
      },
      {
        title: "Subscribers",
        href: "/admin/subscribers",
        icon: UserRoundCheckIcon,
        description: "Pro and Max subscriptions",
      },
      {
        title: "Payments",
        href: "/admin/payments",
        icon: CreditCardIcon,
        description: "Midtrans and manual payments",
      },
      {
        title: "Vouchers",
        href: "/admin/vouchers",
        icon: TicketPercentIcon,
        description: "Checkout coupons and usage",
      },
    ],
  },
  {
    title: "Academics",
    items: [
      {
        title: "Exam Types",
        href: "/admin/exam-types",
        icon: GraduationCapIcon,
        description: "UTBK, UTUL, SIMAK UI, CPNS",
      },
      {
        title: "Subjects",
        href: "/admin/subjects",
        icon: LibraryBigIcon,
        description: "Subjects and subtests",
      },
      {
        title: "Topics",
        href: "/admin/topics",
        icon: FolderTreeIcon,
        description: "Topics for practice filtering",
      },
      {
        title: "Questions",
        href: "/admin/questions",
        icon: FileQuestionIcon,
        description: "Question bank and Excel import",
      },
      {
        title: "Practices",
        href: "/admin/practices",
        icon: BookOpenCheckIcon,
        description: "Practice and quiz modes",
      },
      {
        title: "Materials",
        href: "/admin/materials",
        icon: FileTextIcon,
        description: "Video and text learning content",
      },
      {
        title: "Vocabulary",
        href: "/admin/vocabularies",
        icon: BookTextIcon,
        description: "Free word game content",
      },
      {
        title: "Tryouts",
        href: "/admin/tryouts",
        icon: TrophyIcon,
        description: "Multi-section tryouts",
      },
    ],
  },
  {
    title: "Publishing",
    items: [
      {
        title: "Blog",
        href: "/admin/blog",
        icon: NewspaperIcon,
        description: "Educational articles",
      },
      {
        title: "Blog Categories",
        href: "/admin/blog-categories",
        icon: TagsIcon,
        description: "Article categories",
      },
    ],
  },
]
