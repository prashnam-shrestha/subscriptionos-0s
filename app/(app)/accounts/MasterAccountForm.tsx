"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMasterAccount } from "./actions";

export default function MasterAccountForm({ categories }: { categories: string[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [nickname, setNickname] = useState("");
  const [category, setCategory] = useState(categories[0] || "");
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("nickname", nickname);
    formData.append("category", category);
    formData.append("loginEmail", loginEmail);
    formData.append("password", password);

    startTransition(async () => {
      const res = await createMasterAccount(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
        setNickname("");
        setCategory(categories[0] || "");
        setLoginEmail("");
        setPassword("");
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
      >
        + Add Master Account
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold">Add New Master Account</h2>
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
                  Account Nickname *
                </label>
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. N1"
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Category Tag *
                </label>
                {categories.length > 0 ? (
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-slate-100 focus:outline-none"
                  >
                    <option value="" disabled>
                      Select Category Tag
                    </option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. NP-1"
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-slate-100 focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Login Email / Username *
                </label>
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder=""
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Password (Optional)
                </label>
                <input
                  type="password"
                  
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                  className="rounded-md bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-white disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
