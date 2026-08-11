"use client";

import * as React from "react";

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onForceDelete?: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  forceDeleteText?: string;
  isDestructive?: boolean;
  loading?: boolean;
}

export function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  onForceDelete,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  forceDeleteText = "Force Delete",
  isDestructive = false,
  loading = false,
}: AlertDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        <div className="text-sm text-slate-600 dark:text-slate-400">{description}</div>
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            {cancelText}
          </button>
          {onForceDelete && (
            <button
              type="button"
              onClick={onForceDelete}
              disabled={loading}
              className="rounded bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? "Processing..." : forceDeleteText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded px-4 py-2 text-xs font-medium text-white disabled:opacity-50 ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            }`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
