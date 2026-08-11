"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/dialog";
import { updateProfileAction } from "../actions";

type Profile = {
  id: string;
  masterAccountId: string;
  profileName: string;
  capacity: number;
  isActive: boolean;
  activeCount: number;
};

export default function ProfileEditModal({ profile }: { profile: Profile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await updateProfileAction(formData);
        setIsOpen(false);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to update profile.");
        }
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
      >
        Edit Slot
      </button>

      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Edit Slot: ${profile.profileName}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={profile.id} />
          <input type="hidden" name="masterAccountId" value={profile.masterAccountId} />

          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Profile Name
            </label>
            <input
              type="text"
              name="profileName"
              defaultValue={profile.profileName}
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Seat Capacity
              </label>
              <input
                type="number"
                name="capacity"
                min={profile.activeCount}
                defaultValue={profile.capacity}
                required
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Current active occupancy: {profile.activeCount}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                name="isActive"
                defaultValue={profile.isActive ? "true" : "false"}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Profile PIN (Leave blank to keep current PIN)
            </label>
            <input
              type="text"
              name="pin"
              placeholder="e.g. 1234"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
