import { redirect } from "next/navigation";

/**
 * OTP-first: signing in with a code creates the account automatically
 * (spec §25), so /register funnels into the same OTP flow.
 */
export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = locale === "en" ? "en" : "fa";
  redirect(`/${l}/login`);
}
