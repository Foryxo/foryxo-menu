import Link from "next/link";
import { requireAdmin } from "@/domains/auth/guards";
import { getAdminBranches, getAdminMenus } from "@/domains/admin/data";
import { getDictionary, isLocale } from "@/domains/i18n/index";
import { formatDateTime } from "@/domains/i18n/format";
import { Badge } from "@/components/ui/primitives";
import { MenuPublishActions } from "./menu-publish-actions";

export default async function AdminMenusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  const fa = l === "fa";
  const t = getDictionary(l);
  await requireAdmin(`/${l}/admin/menus`, ["superadmin", "admin", "editor"]);
  const [rows, branchRows] = await Promise.all([getAdminMenus(), getAdminBranches()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display-3">{t.admin.menus}</h1>
        <Link href={`/${l}/admin/qr`} className="rounded-xl border border-line px-4 py-2 text-sm font-bold hover:bg-subtle">{fa ? "مدیریت QR منو و میزها" : "Manage menu & table QR"}</Link>
      </div>
      <div className="surface overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="p-3 text-start font-semibold">{fa ? "منو" : "Menu"}</th>
              <th className="p-3 text-start font-semibold">{fa ? "کسب‌وکار" : "Business"}</th>
              <th className="p-3 text-start font-semibold">{fa ? "وضعیت" : "Status"}</th>
              <th className="p-3 text-start font-semibold">{fa ? "به‌روزرسانی" : "Updated"}</th>
              <th className="p-3 text-end font-semibold">{fa ? "عملیات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ menu, business }) => (
              <tr key={menu.id} className="border-b border-line last:border-0">
                <td className="p-3 font-bold">
                  {menu.title}
                  <span className="block text-xs text-muted" dir="ltr">/menus/{menu.slug}/menu</span>
                </td>
                <td className="p-3">{business.name}</td>
                <td className="p-3">
                  <Badge variant={menu.status === "published" ? "success" : menu.status === "suspended" ? "danger" : "neutral"}>
                    {menu.status}
                  </Badge>
                </td>
                <td className="p-3 text-muted">{formatDateTime(menu.updatedAt, l)}</td>
                <td className="p-3 text-end">
                  <MenuPublishActions
                    menuId={menu.id}
                    status={menu.status}
                    orderingEnabled={menu.orderingEnabled}
                    branchId={menu.branchId}
                    branches={branchRows.filter((branch) => branch.businessId === menu.businessId).map((branch) => ({ id: branch.id, name: branch.name }))}
                    labels={{
                      publish: t.admin.publish,
                      unpublish: t.admin.unpublish,
                      error: t.common.error,
                      orderingOn: fa ? "فعال‌کردن سفارش" : "Enable orders",
                      orderingOff: fa ? "توقف سفارش" : "Pause orders",
                      sharedMenu: fa ? "منوی مشترک" : "Shared menu",
                      assignBranch: fa ? "اتصال به شعبه" : "Assign branch",
                    }}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted">{t.common.empty}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
