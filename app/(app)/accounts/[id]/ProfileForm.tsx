"use client";

import { useState } from "react";
import { createProfile } from "../actions";

export default function ProfileForm({ masterAccountId }: { masterAccountId: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);

    const res = await createProfile(masterAccountId, formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setLoading(false);
      const formEl = document.getElementById("profile-form") as HTMLFormElement;
      if (formEl) formEl.reset();
    }
  }

  return (
    <form id="profile-form" action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-600 border border-red-200 dark:bg-red-950/50 dark:border-red-900 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Profile Name *
        </label>
        <input
          type="text"
          name="profileName"
          required
          placeholder="e.g. Profile 1 (Ram)"
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Profile PIN *
        </label>
        <input
          type="text"
          name="pin"
          required
          placeholder="e.g. 1234"
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Capacity *
        </label>
        <input
          type="number"
          name="capacity"
          required
          defaultValue={4}
          min={1}
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-100"
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Maximum active customer seats allowed on this profile.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {loading ? "Adding..." : "Add Profile Slot"}
      </button>
    </form>
  );
}