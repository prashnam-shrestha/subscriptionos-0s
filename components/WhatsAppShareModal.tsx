'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Copy, Check, X, Users, Send } from 'lucide-react';
import { getWhatsAppShareUrl, formatCredentialMessage } from '@/lib/whatsapp';

export interface CustomerSub {
  id: string;
  expiryDate?: string | Date | null;
  customer?: {
    id: string;
    fullName: string;
    phone?: string | null;
  } | null;
}

interface WhatsAppShareModalProps {
  profileId: string;
  profileName: string;
  category?: string;
  serviceName?: string;
  loginEmail?: string;
  encryptedPassword?: string;
  encryptedPin?: string;
  needsRenotify?: boolean;
  subscriptions: CustomerSub[];
  onMarkNotified?: (profileId: string) => Promise<unknown>;
}

export function WhatsAppShareModal({
  profileId,
  profileName,
  category,
  serviceName,
  loginEmail,
  encryptedPassword,
  encryptedPin,
  needsRenotify = false,
  subscriptions,
  onMarkNotified,
}: WhatsAppShareModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const activeSubs = subscriptions.filter((s) => s.customer);

  // Set of subscription IDs that are marked as notified
  const [notifiedSubIds, setNotifiedSubIds] = useState<Set<string>>(() => new Set());

  // Load per-subscription notification state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storageKey = `notified_subs_${profileId}`;
    const stored = localStorage.getItem(storageKey);

    let currentSet = new Set<string>();

    if (stored !== null) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          currentSet = new Set(parsed);
        }
      } catch (e) {
        console.error("Failed to parse notified_subs from localStorage", e);
      }
    } else {
      if (!needsRenotify) {
        activeSubs.forEach((sub) => currentSet.add(sub.id));
        localStorage.setItem(storageKey, JSON.stringify(Array.from(currentSet)));
      }
    }

    setNotifiedSubIds(currentSet);
  }, [profileId, needsRenotify, activeSubs.length]);

  const saveNotifiedSet = (newSet: Set<string>) => {
    setNotifiedSubIds(newSet);
    if (typeof window !== 'undefined') {
      const storageKey = `notified_subs_${profileId}`;
      localStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)));
    }
  };

  const handleCopy = async (subId: string, messageText: string) => {
    await navigator.clipboard.writeText(messageText);
    setCopiedId(subId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWhatsApp = (phone?: string | null, messageText?: string) => {
    const url = getWhatsAppShareUrl(phone || "", messageText || "");
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleToggleSent = async (subId: string, isCurrentlySent: boolean) => {
    const nextSet = new Set(notifiedSubIds);

    if (isCurrentlySent) {
      nextSet.delete(subId);
    } else {
      nextSet.add(subId);
    }

    saveNotifiedSet(nextSet);

    const allNowNotified = activeSubs.length > 0 && activeSubs.every((sub) => nextSet.has(sub.id));

    if (allNowNotified && onMarkNotified) {
      setLoadingId(subId);
      try {
        await onMarkNotified(profileId);
      } catch (error) {
        console.error("Failed to mark profile notified on backend", error);
      } finally {
        setLoadingId(null);
      }
    }
  };

  const allNotified = activeSubs.length > 0 && activeSubs.every((sub) => notifiedSubIds.has(sub.id));

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        WhatsApp
        {activeSubs.length > 0 && (
          <span className="px-1.5 py-0.2 text-[10px] bg-emerald-800 text-white rounded-full font-bold">
            {activeSubs.length}
          </span>
        )}

        {!allNotified ? (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded">
            Pending
          </span>
        ) : (
          <Check className="w-3.5 h-3.5 text-emerald-200 ml-1" />
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  Share Slot Credentials
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {profileName} • {serviceName || category || "Subscription"}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                type="button"
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeSubs.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <Users className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-xs text-slate-500">No active customers assigned to this slot yet.</p>
                <button
                  onClick={() => {
                    const msg = formatCredentialMessage({
                      serviceName: serviceName || category || "",
                      category,
                      loginEmail: loginEmail || "",
                      encryptedPassword,
                      profileName,
                      encryptedPin,
                    });
                    handleCopy("default", msg);
                  }}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  {copiedId === "default" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === "default" ? "Copied General Text" : "Copy General Text"}
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {activeSubs.map((sub) => {
                  const messageText = formatCredentialMessage({
                    customerName: sub.customer?.fullName,
                    serviceName: serviceName || category || "",
                    category,
                    loginEmail: loginEmail || "",
                    encryptedPassword,
                    profileName,
                    encryptedPin,
                    expiryDate: sub.expiryDate,
                  });

                  const isSent = notifiedSubIds.has(sub.id);

                  return (
                    <div
                      key={sub.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {sub.customer?.fullName || "Customer"}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {sub.customer?.phone || "No Phone Number"}
                          </p>
                        </div>
                        {sub.expiryDate && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-medium text-slate-700 dark:text-slate-300">
                            Expires {new Date(sub.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleCopy(sub.id, messageText)}
                          type="button"
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          {copiedId === sub.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedId === sub.id ? "Copied" : "Copy"}
                        </button>

                        <button
                          onClick={() => handleWhatsApp(sub.customer?.phone, messageText)}
                          type="button"
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send
                        </button>

                        <button
                          onClick={() => handleToggleSent(sub.id, isSent)}
                          disabled={loadingId === sub.id}
                          type="button"
                          title={isSent ? "Click to unmark as sent" : "Click to mark as sent"}
                          className={`px-2.5 py-1.5 text-xs font-medium rounded border transition cursor-pointer ${
                            isSent
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-slate-800 hover:text-slate-300"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700"
                          }`}
                        >
                          {loadingId === sub.id ? "..." : isSent ? "✓ Sent" : "Mark Notified"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
