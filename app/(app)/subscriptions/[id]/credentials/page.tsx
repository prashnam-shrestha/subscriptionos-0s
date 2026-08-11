import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { notFound } from "next/navigation";
import Link from "next/link";
import CopyCredentialsButton from "./CopyCredentialsButton";

export default async function CredentialsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      customer: true,
      product: true,
      profile: {
        include: {
          masterAccount: true,
        },
      },
    },
  });

  if (!subscription) {
    notFound();
  }

  const decryptedPassword = decrypt(
    subscription.profile.masterAccount.encryptedPassword
  );
  const decryptedPin = decrypt(subscription.profile.encryptedPin);

  const formattedExpiry = new Date(subscription.expiryDate).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  );

  const credentialMessage = `Hi ${subscription.customer.fullName}! Here are your ${subscription.product.name} details:
Login: ${subscription.profile.masterAccount.loginEmail} / ${decryptedPassword}
Profile: ${subscription.profile.profileName} — PIN: ${decryptedPin}
Valid until: ${formattedExpiry}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/customers/${subscription.customerId}`}
          className="text-xs text-slate-500 hover:text-slate-900"
        >
          ← Return to Customer Profile
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">
          Subscription Credentials
        </h1>
        <p className="text-sm text-slate-600">
          Copy and send this text directly to the customer.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Assembled Credential Block
          </span>
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
            Status: {subscription.status}
          </span>
        </div>

        <pre className="whitespace-pre-wrap rounded-md bg-slate-900 p-4 font-mono text-sm text-slate-100 leading-relaxed">
          {credentialMessage}
        </pre>

        <CopyCredentialsButton textToCopy={credentialMessage} />
      </div>
    </div>
  );
}