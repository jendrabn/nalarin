import { PageHeader } from "@/components/page-header";

type LegalSection = {
  id: string;
  title: string;
  description?: string;
  items: string[];
};

type LegalPageProps = {
  title: string;
  intro: string;
  version: string;
  sections: LegalSection[];
};

export function LegalPage({
  title,
  intro,
  version,
  sections,
}: LegalPageProps) {
  return (
    <main className="bg-background text-foreground">
      <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <PageHeader
          title={title}
          titleClassName="text-3xl font-bold sm:text-4xl"
        />
        <p className="-mt-2 mb-10 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          {intro}
        </p>

        <article className="min-w-0 space-y-10">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                {section.title}
              </h2>
              {section.description ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {section.description}
                </p>
              ) : null}
              <ul className="mt-5 space-y-3 text-sm leading-7 text-muted-foreground sm:text-base">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-3 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="border-t pt-8 text-sm font-bold text-foreground">
            Versi: {version}
          </p>
        </article>
      </section>
    </main>
  );
}
