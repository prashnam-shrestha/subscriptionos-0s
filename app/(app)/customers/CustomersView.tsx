"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { AlertDialog } from "@/components/ui/alert-dialog";
import CopyContactButton, { formatCustomerContact } from "@/components/CopyContactButton";
import CustomerForm from "./CustomerForm";
import {
  checkCustomerDependencies,
  deleteOrDeactivateCustomerAction,
  forceDeleteCustomerAction,
} from "@/lib/dependency-checks";

type Customer = {
  id: string;
  fullName: string;
  phone: string;
  notes: string | null;
  isActive: boolean;
  subscriptions: { id: string; status: string }[];
};

export default function CustomersView({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deps, setDeps] = useState<{
    hasActiveSubscriptions: boolean;
    hasHistory: boolean;
    totalCount: number;
    activeCount: number;
  } | null>(null);
  const [isChecking, startCheckTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const filteredCustomers = useMemo(() => {
    const searchTokens = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (searchTokens.length === 0) return customers;

    return customers.filter((customer) => {
      const searchableText = [
        customer.fullName,
        customer.phone,
        customer.notes,
        formatCustomerContact(customer.fullName, customer.phone),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchTokens.every((token) => searchableText.includes(token));
    });
  }, [customers, search]);

  function handleInitiateDelete(e: React.MouseEvent, customer: Customer) {
    e.stopPropagation();
    setSelectedCustomer(customer);
    startCheckTransition(async () => {
      const result = await checkCustomerDependencies(customer.id);
      setDeps(result);
    });
  }

  function handleConfirmDelete() {
    if (!selectedCustomer) return;
    startDeleteTransition(async () => {
      await deleteOrDeactivateCustomerAction(selectedCustomer.id);
      setSelectedCustomer(null);
      setDeps(null);
    });
  }

  function handleForceDelete() {
    if (!selectedCustomer) return;
    startDeleteTransition(async () => {
      await forceDeleteCustomerAction(selectedCustomer.id);
      setSelectedCustomer(null);
      setDeps(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Customer Directory
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage customer profiles, contact info, and active subscription status
          </p>
        </div>
        <CustomerForm />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <div className="relative max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name or phone number..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-100"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No customers match the search criteria.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">CustomerID</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Active Subscriptions</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredCustomers.map((customer) => {
                const activeSubsCount = customer.subscriptions.filter(
                  (s) => s.status === "Active"
                ).length;
                const contactLabel = formatCustomerContact(customer.fullName, customer.phone);

                return (
                  <tr
                    key={customer.id}
                    onClick={() => router.push(`/customers/${customer.id}`)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                          {contactLabel}
                        </span>
                        <CopyContactButton
                          fullName={customer.fullName}
                          phone={customer.phone}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      {customer.fullName}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{customer.phone}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {activeSubsCount}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={customer.isActive ? "success" : "secondary"}>
                        {customer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => handleInitiateDelete(e, customer)}
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
        isOpen={!!selectedCustomer}
        onClose={() => {
          setSelectedCustomer(null);
          setDeps(null);
        }}
        onConfirm={handleConfirmDelete}
        onForceDelete={deps?.hasHistory ? handleForceDelete : undefined}
        forceDeleteText="Force Delete"
        title={
          deps?.hasHistory
            ? `Manage Delete: ${selectedCustomer?.fullName}`
            : `Delete Customer: ${selectedCustomer?.fullName}?`
        }
        description={
          isChecking ? (
            <p>Scanning customer subscription records...</p>
          ) : deps?.hasHistory ? (
            <div className="space-y-2">
              <p className="font-semibold text-amber-600 dark:text-amber-400">
                Customer has {deps.totalCount} total subscription record(s) ({deps.activeCount} active).
              </p>
              <p>
                You can safely <strong>Deactivate</strong> this profile to preserve past data, or <strong>Force Delete</strong> to permanently erase the customer and all associated subscription records.
              </p>
            </div>
          ) : (
            <p>
              Customer has zero historical subscriptions. This record will be permanently deleted.
            </p>
          )
        }
        confirmText={deps?.hasHistory ? "Deactivate Customer" : "Permanently Delete"}
        isDestructive={!deps?.hasHistory}
        loading={isDeleting || isChecking}
      />
    </div>
  );
}
