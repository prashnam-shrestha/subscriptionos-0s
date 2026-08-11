"use client";

import { useState, useTransition } from "react";
import { Check, Copy, MessageSquare, MonitorPlay } from "lucide-react";
import { completeTaskAction } from "./actions";
import { getWhatsAppShareUrl } from "@/lib/whatsapp";

type TaskType =
  | "NOTIFY_NEW_SUBSCRIPTION"
  | "NOTIFY_PIN_CHANGE"
  | "PHYSICAL_STREAMING_PIN_CHANGE"
  | "PHYSICAL_PROFILE_CREATION"
  | "NOTIFY_CREDENTIAL_CHANGE"
  | "NOTIFY_MIGRATION";
type TaskStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  title: string;
  description: string;
  metadata: string;
  createdAt: Date;
}

function ProfilePinButtons({
  phone,
  profileMessageText,
  copiedKey,
  onCopy,
}: {
  phone: string;
  profileMessageText: string;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
}) {
  return (
    <>
      <a
        href={getWhatsAppShareUrl(phone, profileMessageText)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        WhatsApp: Profile & PIN
      </a>
      <button
        type="button"
        onClick={() => onCopy("profile", profileMessageText)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition"
      >
        {copiedKey === "profile" ? (
          <Check className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
        {copiedKey === "profile" ? "Copied!" : "Copy for IG"}
      </button>
    </>
  );
}

function EmailLoginButtons({
  phone,
  loginMessageText,
  copiedKey,
  onCopy,
}: {
  phone: string;
  loginMessageText: string;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
}) {
  return (
    <>
      <a
        href={getWhatsAppShareUrl(phone, loginMessageText)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        WhatsApp: Email Login
      </a>
      <button
        type="button"
        onClick={() => onCopy("login", loginMessageText)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition"
      >
        {copiedKey === "login" ? (
          <Check className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
        {copiedKey === "login" ? "Copied!" : "Copy for IG"}
      </button>
    </>
  );
}

export default function TaskCard({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleComplete = () => {
    startTransition(async () => {
      await completeTaskAction(task.id);
    });
  };

  const handleCopyForIg = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Clipboard may be unavailable in insecure contexts
    }
  };

  const metadata = task.metadata ? JSON.parse(task.metadata) : {};

  const isNotification =
    task.type === "NOTIFY_NEW_SUBSCRIPTION" ||
    task.type === "NOTIFY_PIN_CHANGE" ||
    task.type === "NOTIFY_CREDENTIAL_CHANGE" ||
    task.type === "NOTIFY_MIGRATION";
  const isPhysical =
    task.type === "PHYSICAL_STREAMING_PIN_CHANGE" ||
    task.type === "PHYSICAL_PROFILE_CREATION";
  const isDualNotification =
    task.type === "NOTIFY_NEW_SUBSCRIPTION" || task.type === "NOTIFY_MIGRATION";

  const isSameMasterMigration =
    task.type === "NOTIFY_MIGRATION" &&
    (metadata.sameMasterAccount === true ||
      (metadata.fromMasterAccountId &&
        metadata.toMasterAccountId &&
        metadata.fromMasterAccountId === metadata.toMasterAccountId));

  const showEmailLogin =
    isDualNotification &&
    metadata.phone &&
    metadata.loginMessageText &&
    metadata.profileMessageText &&
    !(task.type === "NOTIFY_MIGRATION" && isSameMasterMigration);

  const showProfilePin =
    isDualNotification &&
    metadata.phone &&
    metadata.loginMessageText &&
    metadata.profileMessageText;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {isPhysical ? (
              <MonitorPlay className="w-4 h-4 text-purple-500" />
            ) : (
              <MessageSquare className="w-4 h-4 text-blue-500" />
            )}
            {task.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {task.description}
          </p>
        </div>
        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
          {new Date(task.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50 flex flex-wrap gap-2 items-center">
        {task.status === "PENDING" ? (
          <>
            {showEmailLogin && (
              <EmailLoginButtons
                phone={metadata.phone}
                loginMessageText={metadata.loginMessageText}
                copiedKey={copiedKey}
                onCopy={handleCopyForIg}
              />
            )}
            {showProfilePin && (
              <ProfilePinButtons
                phone={metadata.phone}
                profileMessageText={metadata.profileMessageText}
                copiedKey={copiedKey}
                onCopy={handleCopyForIg}
              />
            )}
            {!showEmailLogin &&
              !showProfilePin &&
              isNotification &&
              metadata.phone &&
              metadata.messageText && (
                <>
                  <a
                    href={getWhatsAppShareUrl(metadata.phone, metadata.messageText)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyForIg("message", metadata.messageText)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition"
                  >
                    {copiedKey === "message" ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedKey === "message" ? "Copied!" : "Copy for IG"}
                  </button>
                </>
              )}

            <button
              onClick={handleComplete}
              disabled={isPending}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition ${
                isPending
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                  : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              }`}
            >
              <Check className="w-3.5 h-3.5 text-green-600" />
              {isPending ? "Completing..." : "Mark as Complete"}
            </button>
          </>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Check className="w-3.5 h-3.5" /> Completed
          </span>
        )}
      </div>
    </div>
  );
}
