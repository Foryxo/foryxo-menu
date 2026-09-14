import { desc } from "drizzle-orm";
import { requireAdmin } from "@/domains/auth/guards";
import { isLocale } from "@/domains/i18n/config";
import { formatDateTime } from "@/domains/i18n/format";
import { getDb } from "@/domains/db/client";
import { user } from "@/domains/db/schema/index";
import { Badge, Card, CardContent } from "@/components/ui/primitives";
import { UserAccess } from "./user-access";
export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const { role } = await requireAdmin();
  const rows = await getDb()
    .select()
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(300);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-3">
          {fa ? "کاربران و دسترسی‌ها" : "Users & access"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {fa
            ? "نقش‌ها و تعلیق حساب‌ها؛ همه تغییرات ثبت می‌شوند."
            : "Roles and account suspension; every change is audited."}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((row) => (
          <Card key={row.id}>
            <CardContent>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-extrabold">{row.name}</h2>
                  <p className="truncate text-sm text-muted" dir="ltr">
                    {row.email}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDateTime(row.createdAt, l)}
                  </p>
                </div>
                <Badge
                  variant={
                    row.isSuspended
                      ? "danger"
                      : row.role === "superadmin"
                        ? "success"
                        : "default"
                  }
                >
                  {row.isSuspended ? "suspended" : row.role}
                </Badge>
              </div>
              {role === "superadmin" ? (
                <UserAccess
                  userId={row.id}
                  initialRole={row.role}
                  initialSuspended={row.isSuspended}
                  locale={l}
                />
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
