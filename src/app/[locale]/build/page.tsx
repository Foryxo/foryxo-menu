import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { BuilderWizard } from "./builder-wizard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(isLocale(locale) ? locale : "fa");
  return {
    title: t.build.title,
    description: t.build.accountNote,
    robots: { index: false, follow: true }, // private flow per spec §93
  };
}

export default async function BuildPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const { locale } = await params;
  const { demo } = await searchParams;
  const l = isLocale(locale) ? locale : "fa";
  const t = getDictionary(l);

  return (
    <PageShell locale={l}>
      <BuilderWizard
        locale={l}
        presetDemo={demo ?? null}
        labels={{
          title: t.build.title,
          step: t.build.step,
          of: t.build.of,
          steps: t.build.steps,
          businessType: t.build.businessType,
          chooseDemo: t.build.chooseDemo,
          styleName: t.build.styleName,
          styleNameEn: t.build.styleNameEn,
          styleColor: t.build.styleColor,
          styleColorSecondary: t.build.styleColorSecondary,
          styleMode: t.build.styleMode,
          styleFont: t.build.styleFont,
          styleFontFeel: t.build.styleFontFeel,
          languageFa: t.build.languageFa,
          languageEn: t.build.languageEn,
          languageFaEn: t.build.languageFaEn,
          languageOther: t.build.languageOther,
          featuresTitle: t.build.featuresTitle,
          featuresIncluded: t.build.featuresIncluded,
          recommended: t.build.recommended,
          contentOptions: t.build.contentOptions,
          domainOptions: t.build.domainOptions,
          domainOwn: t.build.domainOwn,
          domainOwnHint: t.build.domainOwnHint,
          domainNoneHint: t.build.domainNoneHint,
          domainWebsiteHint: t.build.domainWebsiteHint,
          managementOptions: t.build.managementOptions,
          managementSelfHint: t.build.managementSelfHint,
          managementManagedHint: t.build.managementManagedHint,
          reviewTitle: t.build.reviewTitle,
          estimateInitial: t.build.estimateInitial,
          estimateRecurring: t.build.estimateRecurring,
          estimateNote: t.build.estimateNote,
          accountTitle: t.build.accountTitle,
          accountNote: t.build.accountNote,
          submitProject: t.build.submitProject,
          submitted: t.build.submitted,
          submittedBody: t.build.submittedBody,
          goToDashboard: t.build.goToDashboard,
          progressSaved: t.build.progressSaved,
          summary: t.build.summary,
          change: t.build.change,
          next: t.common.next,
          previous: t.common.previous,
          login: t.common.login,
          toman: t.common.toman,
          currencyNote: t.common.currencyNote,
          demo: t.common.demo,
        }}
      />
    </PageShell>
  );
}
