"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function formatCustomerContact(fullName: string, phone: string): string {
  return `${fullName.trim()} ${phone.trim()}`;
}

export default function CopyContactButton({
  fullName,
  phone,
  className = "",
}: {
  fullName: string;
  phone: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(formatCustomerContact(fullName, phone));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy contact"
      className={`inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </button>
  );
}
