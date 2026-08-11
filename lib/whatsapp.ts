import { decrypt } from "@/lib/encryption";

type WhatsAppProfileParams = {
  customerName?: string;
  profileName: string;
  encryptedPin?: string | null;
  expiryDate?: Date | string | null;
};

type WhatsAppMasterAccountParams = {
  customerName?: string;
  productName?: string;
  category?: string;
  serviceName?: string;
  loginEmail: string;
};

export function formatMasterAccountLoginMessage({
  customerName,
  productName,
  category,
  serviceName,
  loginEmail,
}: WhatsAppMasterAccountParams): string {
  const name = customerName?.trim() || "Customer";
  const title = productName
    ? productName.trim()
    : (serviceName || category || "SERVICE").trim().toUpperCase();
  const divider = "━━━━━━━━━━━━━━━━━━";

  return `Hi ${name}!
${divider}
${title} LOGIN
${divider}

Email: ${loginEmail}

Please use the email above to log in.
We will provide the verification code to complete your login.

${divider}`;
}

export function formatProfileCredentialMessage({
  customerName,
  profileName,
  encryptedPin,
  expiryDate,
}: WhatsAppProfileParams): string {
  const name = customerName?.trim() || "Customer";
  const pinDisplay = encryptedPin ? decrypt(encryptedPin) : "None";
  const formattedExpiry = expiryDate
    ? new Date(expiryDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const divider = "━━━━━━━━━━━━━━━━━━";

  return `Hi ${name}!
${divider}
SUBSCRIPTION DETAILS
${divider}

Profile: ${profileName}
PIN: ${pinDisplay}
Expiry Date: ${formattedExpiry}

Please use only your assigned profile and do not change the profile, PIN, or account settings.`;
}

export function formatCredentialMessage(params: any): string {
  if (params.loginEmail && !params.profileName) {
    return formatMasterAccountLoginMessage(params);
  }
  return formatProfileCredentialMessage(params);
}

export function getWhatsAppShareUrl(phone: string | null | undefined, text: string): string {
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const encodedText = encodeURIComponent(text);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}
