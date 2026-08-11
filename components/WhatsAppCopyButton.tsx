'use client';

import React, { useState } from 'react';
import { Copy, Check, MessageSquare } from 'lucide-react';
import { getWhatsAppShareUrl } from '@/lib/whatsapp';

interface WhatsAppCopyButtonProps {
  phoneNumber?: string;
  messageText: string;
  profileId?: string;
  onMarkNotified?: (profileId: string) => Promise<unknown>;
}

export function WhatsAppCopyButton({
  phoneNumber,
  messageText,
  profileId,
  onMarkNotified,
}: WhatsAppCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [notified, setNotified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const url = getWhatsAppShareUrl(phoneNumber, messageText);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleMarkSent = async () => {
    if (profileId && onMarkNotified) {
      setLoading(true);
      try {
        await onMarkNotified(profileId);
        setNotified(true);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        type="button"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
        title="Copy credential message"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>

      <button
        onClick={handleWhatsApp}
        type="button"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
        title="Send via WhatsApp"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        WhatsApp
      </button>

      {profileId && onMarkNotified && !notified && (
        <button
          onClick={handleMarkSent}
          disabled={loading}
          type="button"
          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Mark Notified'}
        </button>
      )}
      {notified && (
        <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Sent</span>
      )}
    </div>
  );
}
