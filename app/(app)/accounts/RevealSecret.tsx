"use client";

import { useState } from "react";
import { revealSecret } from "./actions";

interface RevealSecretProps {
  encryptedValue: string;
  label?: string;
}

export default function RevealSecret({ encryptedValue, label = "Password" }: RevealSecretProps) {
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReveal = async () => {
    if (revealedValue) {
      setRevealedValue(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await revealSecret(encryptedValue);
      setRevealedValue(result);
    } catch (err: any) {
      setError(err?.message || "Unauthorized action.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">
          {revealedValue ? revealedValue : "••••••••"}
        </span>
        <button
          onClick={handleReveal}
          disabled={loading}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
        >
          {loading ? "Decrypting..." : revealedValue ? "Hide" : `Reveal ${label}`}
        </button>
      </div>
      {error && (
        <span className="text-xs text-red-500 font-medium">{error}</span>
      )}
    </div>
  );
}
