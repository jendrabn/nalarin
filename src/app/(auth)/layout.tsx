import { MarketingFooter } from "@/features/marketing/components/marketing-footer";
import {
  MarketingNavbar,
  type MarketingUser,
} from "@/features/marketing/components/marketing-navbar";

const currentUser: MarketingUser = null;

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNavbar user={currentUser} />
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
