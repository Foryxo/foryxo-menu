"use client";

import { useState } from "react";
import type { Locale } from "@/domains/i18n/config";
import { Field, Select } from "@/components/ui/primitives";
import { BranchManager } from "../../dashboard/branches/branch-manager";

interface BranchRow {
  id: string; businessId: string; name: string; address: string; city: string; province: string; phone: string; mapUrl: string;
  isPrimary: boolean; isActive: boolean; acceptsOrders: boolean; fulfillmentTypes: string[]; minimumOrder: number;
  orderContactPhone: string; notificationEmail: string; createdAt: string; updatedAt: string;
}

export function AdminBranchesManager({ locale, businesses, branches }: { locale: Locale; businesses: { id: string; name: string }[]; branches: BranchRow[] }) {
  const fa = locale === "fa";
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  if (!businessId) return <p className="text-sm text-muted">{fa ? "هنوز کسب‌وکاری ثبت نشده است." : "No businesses exist yet."}</p>;
  return <div className="space-y-6">
    <div className="max-w-md"><Field label={fa ? "مدیریت شعبه‌های کسب‌وکار" : "Manage business branches"} htmlFor="admin-branch-business"><Select id="admin-branch-business" value={businessId} onChange={(event) => setBusinessId(event.target.value)}>{businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</Select></Field></div>
    <BranchManager key={businessId} locale={locale} businessId={businessId} initialBranches={branches.filter((branch) => branch.businessId === businessId)} />
  </div>;
}
