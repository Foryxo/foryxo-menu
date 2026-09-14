"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Labels {
  publish: string; unpublish: string; error: string; orderingOn: string; orderingOff: string; sharedMenu: string; assignBranch: string;
}

export function MenuPublishActions({
  menuId, status, orderingEnabled, branchId, branches, labels: L,
}: {
  menuId: string; status: string; orderingEnabled: boolean; branchId: string | null; branches: { id: string; name: string }[]; labels: Labels;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(branchId ?? "");

  async function act(action: "publish" | "unpublish" | "enable_ordering" | "disable_ordering" | "assign_branch") {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/menus/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId, action, ...(action === "assign_branch" ? { branchId: selectedBranch || null } : {}) }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-wrap items-center justify-end gap-2">
      {status !== "published" ? (
        <Button size="sm" loading={busy} onClick={() => act("publish")}>
          {L.publish}
        </Button>
      ) : (
        <Button size="sm" variant="outline" loading={busy} onClick={() => act("unpublish")}>
          {L.unpublish}
        </Button>
      )}
      <Button size="sm" variant={orderingEnabled ? "danger" : "outline"} loading={busy} onClick={() => act(orderingEnabled ? "disable_ordering" : "enable_ordering")}>
        {orderingEnabled ? L.orderingOff : L.orderingOn}
      </Button>
      {branches.length ? <><select value={selectedBranch} onChange={(event) => setSelectedBranch(event.target.value)} className="h-9 max-w-40 rounded-xl border border-line bg-elevated px-2 text-xs font-bold" aria-label={L.assignBranch}><option value="">{L.sharedMenu}</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select><Button size="sm" variant="outline" loading={busy} onClick={() => act("assign_branch")}>{L.assignBranch}</Button></> : null}
      {error ? <span className="text-xs text-red-600" role="alert">{L.error}</span> : null}
    </div>
  );
}
