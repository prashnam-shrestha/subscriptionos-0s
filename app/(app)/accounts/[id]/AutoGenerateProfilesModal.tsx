"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { bulkCreateProfilesAction } from "../actions";

export default function AutoGenerateProfilesModal({
  masterAccountId,
  category,
}: {
  masterAccountId: string;
  category: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const catLower = (category || "").toLowerCase();
  const isPrimeCat =
    catLower.includes("prime") ||
    catLower.startsWith("ps") ||
    catLower.startsWith("pr");

  const [preset, setPreset] = useState<"netflix" | "prime" | "custom">(
    isPrimeCat ? "prime" : "netflix"
  );
  const [capacity, setCapacity] = useState<number | string>(2);
  const [profileNamesText, setProfileNamesText] = useState<string>("");

  useEffect(() => {
    if (preset === "netflix") {
      setProfileNamesText("SuperSasto, 1, 2, 3, 4");
      setCapacity(2);
    } else if (preset === "prime") {
      setProfileNamesText("SuperSasto, 1, 2, 3, 4, 5");
      setCapacity(2);
    }
  }, [preset]);

  function handleOpen() {
    setError(null);
    if (isPrimeCat) {
      setPreset("prime");
      setProfileNamesText("SuperSasto, 1, 2, 3, 4, 5");
    } else {
      setPreset("netflix");
      setProfileNamesText("SuperSasto, 1, 2, 3, 4");
    }
    setCapacity(2);
    setIsOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const names = profileNamesText
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);

    if (names.length === 0) {
      setError("Please enter at least one profile name.");
      return;
    }

    const parsedCapacity = typeof capacity === "number" ? capacity : parseInt(capacity, 10);
    const validCapacity = isNaN(parsedCapacity) || parsedCapacity < 1 ? 2 : parsedCapacity;

    const profilesPayload = names.map((name) => ({
      profileName: name,
      capacity: validCapacity,
    }));

    startTransition(async () => {
      const res = await bulkCreateProfilesAction(
        masterAccountId,
        profilesPayload
      );
      if (res?.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
      >
        ⚡ Auto Generate
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold">Auto Generate Profiles</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Preset Configuration
                </label>
                <select
                  value={preset}
                  onChange={(e) =>
                    setPreset(e.target.value as "netflix" | "prime" | "custom")
                  }
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-slate-100 focus:outline-none"
                >
                  <option value="netflix">Netflix (5 Profiles: SuperSasto, 1, 2, 3, 4)</option>
                  <option value="prime">Prime (6 Profiles: SuperSasto, 1, 2, 3, 4, 5)</option>
                  <option value="custom">Custom Configuration</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Profile Names (Comma Separated) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={profileNamesText}
                  onChange={(e) => {
                    setProfileNamesText(e.target.value);
                    if (preset !== "custom") setPreset("custom");
                  }}
                  placeholder="SuperSasto, 1, 2, 3, 4"
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-slate-100 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Separated by commas. Each item generates 1 slot with a random, unique 4-digit PIN.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Default Seat Capacity per Slot *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={capacity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setCapacity("");
                    } else {
                      const num = parseInt(val, 10);
                      setCapacity(isNaN(num) ? "" : num);
                    }
                  }}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isPending ? "Generating..." : "Apply & Generate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
