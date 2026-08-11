"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { AlertDialog } from "@/components/ui/alert-dialog";
import MasterAccountForm from "./MasterAccountForm";
import AccountEditModal from "./AccountEditModal";
import {
  checkMasterAccountDependencies,
  deleteOrDeactivateMasterAccountAction,
  forceDeleteMasterAccountAction,
} from "@/lib/dependency-checks";

type MasterAccount = {
  id: string;
  nickname: string;
  category: string;
  loginEmail: string;
  isActive: boolean;
  profiles: {
    id: string;
    capacity: number;
    subscriptions: { id: string; status: string }[];
  }[];
};

export default function AccountsView({
  accounts,
  categories = [],
}: {
  accounts: MasterAccount[];
  categories?: string[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<MasterAccount | null>(null);
  const [deps, setDeps] = useState<{
    hasActiveSubscriptions: boolean;
    hasHistory: boolean;
    totalCount: number;
    activeCount: number;
    profilesCount: number;
  } | null>(null);

  const [isChecking, startCheckTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const filteredAccounts = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(
      (a) =>
        a.nickname.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.loginEmail.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  function handleInitiateDelete(e: React.MouseEvent, account: MasterAccount) {
    e.stopPropagation();
    setSelectedAccount(account);
    startCheckTransition(async () => {
      const result = await checkMasterAccountDependencies(account.id);
      setDeps(result);
    });
  }

  function handleConfirmDelete() {
    if (!selectedAccount) return;
    startDeleteTransition(async () => {
      await deleteOrDeactivateMasterAccountAction(selectedAccount.id);
      setSelectedAccount(null);
      setDeps(null);
    });
  }

  function handleForceDelete() {
    if (!selectedAccount) return;
    startDeleteTransition(async () => {
      await forceDeleteMasterAccountAction(selectedAccount.id);
      setSelectedAccount(null);
      setDeps(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Master Accounts Inventory
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Shared master subscription accounts, security credentials, and slot allocation engine
          </p>
        </div>
        <MasterAccountForm categories={categories} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search master accounts by nickname, category tag, or login email..."
          className="w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-100"
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {filteredAccounts.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No master accounts match the filter criteria.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Nickname</th>
                <th className="px-4 py-3">Category Tag</th>
                <th className="px-4 py-3">Login Email</th>
                <th className="px-4 py-3">Slots Utilization</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredAccounts.map((account) => {
                const totalCap = account.profiles.reduce((acc, p) => acc + p.capacity, 0);
                const activeOcc = account.profiles.reduce(
                  (acc, p) => acc + p.subscriptions.filter((s) => s.status === "Active").length,
                  0
                );

                return (
                  <tr
                    key={account.id}
                    onClick={() => router.push(`/accounts/${account.id}`)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      {account.nickname}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {account.category}
                    </td>
                    <td className="px-4 py-3">{account.loginEmail}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {activeOcc} / {totalCap} Seats ({account.profiles.length} Slots)
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={account.isActive ? "success" : "secondary"}>
                        {account.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td
                      className="px-4 py-3 flex items-center gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <AccountEditModal account={account} categories={categories} />
                      <button
                        type="button"
                        onClick={(e) => handleInitiateDelete(e, account)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AlertDialog
        isOpen={selectedAccount !== null}
        onClose={() => {
          setSelectedAccount(null);
          setDeps(null);
        }}
        onConfirm={handleConfirmDelete}
        onForceDelete={deps?.hasHistory ? handleForceDelete : undefined}
        forceDeleteText="Force Delete"
        loading={isDeleting || isChecking}
        title={
          deps?.hasHistory
            ? `Manage Delete: ${selectedAccount?.nickname}`
            : `Delete Master Account: ${selectedAccount?.nickname}?`
        }
        description={
          isChecking ? (
            <p>Scanning profile slots and subscription history...</p>
          ) : deps?.hasHistory ? (
            <div className="space-y-2">
              <p className="font-semibold text-amber-600 dark:text-amber-400">
                This account has {deps.totalCount} historical subscription(s) across its slots.
              </p>
              <p>
                You can safely <strong>Deactivate</strong> the account and slots, or <strong>Force Delete</strong> to permanently erase the master account, profile slots, and linked subscriptions.
              </p>
            </div>
          ) : (
            <p>
              This Master Account has 0 historical subscriptions. Confirming will permanently remove it and its profile slots.
            </p>
          )
        }
        confirmText={deps?.hasHistory ? "Deactivate Account" : "Permanently Delete"}
        isDestructive={!deps?.hasHistory}
      />
    </div>
  );
}
