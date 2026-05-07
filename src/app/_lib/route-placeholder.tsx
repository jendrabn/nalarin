import { ComingSoon } from "../../../components/coming-soon";

type AppSection = "Public" | "Auth" | "Dashboard" | "Admin";

type RoutePlaceholderProps = {
  section: AppSection;
  route: string;
  title?: string;
  description?: string;
};

export function RoutePlaceholder(props: RoutePlaceholderProps) {
  void props;

  return <ComingSoon />;
}
