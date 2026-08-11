"use client";

import { toggleProductStatus } from "./actions";

export default function ProductRowActions({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  return (
    <button
      onClick={() => toggleProductStatus(id, isActive)}
      className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 underline"
    >
      {isActive ? "Deactivate" : "Activate"}
    </button>
  );
}