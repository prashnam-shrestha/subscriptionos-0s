"use client";

import { useState, useTransition } from "react";
import ProfileEditModal from "./ProfileEditModal";
import { AlertDialog } from "@/components/ui/alert-dialog";
import {
  checkProfileDependencies,
  deleteOrDeactivateProfileAction,
  forceDeleteProfileAction,
} from "@/lib/dependency-checks";

type ProfileProps = {
  id: string;
  masterAccountId: string;
  profileName: string;
  capacity: number;
  isActive: boolean;
  activeCount: number;
};

export default function ProfileRowActions({ profile }: { profile: ProfileProps }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deps, setDeps] = useState<{
    hasHistory: boolean;
    totalCount: number;
  } | null>(null);

  const [isChecking, startCheckTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleInitiateDelete() {
    startCheckTransition(async () => {
      const result = await checkProfileDependencies(profile.id);
      setDeps(result);
      setShowDeleteDialog(true);
    });
  }

  function handleConfirmDelete() {
    startDeleteTransition(async () => {
      await deleteOrDeactivateProfileAction(profile.id);
      setShowDeleteDialog(false);
    });
  }

  function handleForceDelete() {
    startDeleteTransition(async () => {
      await forceDeleteProfileAction(profile.id);
      setShowDeleteDialog(false);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <ProfileEditModal profile={profile} />
      <button
        type="button"
        onClick={handleInitiateDelete}
        disabled={isChecking}
        className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
      >
        {isChecking ? "..." : "Delete"}
      </button>

      <AlertDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        onForceDelete={deps?.hasHistory ? handleForceDelete : undefined}
        forceDeleteText="Force Delete"
        loading={isDeleting}
        title={
          deps?.hasHistory
            ? `Manage Delete Slot: ${profile.profileName}`
            : `Delete Profile Slot: ${profile.profileName}?`
        }
        description={
          deps?.hasHistory ? (
            <div className="space-y-2">
              <p className="font-semibold text-amber-600 dark:text-amber-400">
                This profile slot has {deps.totalCount} historical subscription(s).
              </p>
              <p>
                You can safely <strong>Deactivate</strong> this slot, or <strong>Force Delete</strong> to permanently erase the slot and all associated subscription records.
              </p>
            </div>
          ) : (
            `This profile slot has 0 historical subscriptions. Confirming will permanently delete it.`
          )
        }
        confirmText={deps?.hasHistory ? "Deactivate Slot" : "Permanently Delete"}
        isDestructive={!deps?.hasHistory}
      />
    </div>
  );
}
