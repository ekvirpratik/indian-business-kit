import { LegalLayout } from "@/components/shared/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.indianbusinesskit.in"),
  title: "Refund & Cancellation Policy - Indian Business Kit",
  description: "Refund and cancellation policies for subscriptions to Indian Business Kit.",
};

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund & Cancellation Policy" lastUpdated="May 14, 2026">
      <p className="text-lg">
        Thank you for choosing <strong>Indian Business Kit</strong> (operated by <strong>Western India Payment Services Private Limited</strong>).
      </p>
      <p className="mt-4">
        As a provider of digital Software-as-a-Service (SaaS) applications and software packages, we maintain clear guidelines regarding subscription refunds and cancellations. Please read this policy carefully before registering or purchasing a subscription plan.
      </p>

      <hr className="my-8 border-gray-100" />

      <h2 className="text-2xl font-bold mb-4">1. No Refund Policy</h2>
      <p>
        We have a strict **No-Refund Policy** for all subscription plans:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-3 mt-2">
        <li>
          <strong>Digital Products Only:</strong> Indian Business Kit delivers purely digital products, software tools, and cloud-based business management services. No physical products, shipping, or physical delivery elements are needed or involved.
        </li>
        <li>
          <strong>SaaS Provisioning:</strong> Because our services are digital assets that are instantly provisioned, accessed, and consumed upon successful payment, we are unable to retract digital licenses once unlocked.
        </li>
        <li>
          <strong>Finality of Payments:</strong> All transactions made on the Indian Business Kit platform are final. We do not provide refund facilities, partial refunds, or credit balances under any circumstances.
        </li>
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">2. Account Cancellation</h2>
      <p>
        Cancellation rules for registered accounts:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-3 mt-2">
        <li>
          <strong>No Account Cancellation:</strong> You cannot cancel your account after registration. Once registered, your account credentials and system profile will remain active to ensure data consistency, transaction tracking, and historic record security.
        </li>
        <li>
          <strong>Further Assistance:</strong> If you no longer wish to use our platform, or if you need to modify your profile settings, freeze dynamic synchronization, or request other custom operational changes, you may contact our support team at any time for further assistance.
        </li>
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">3. Contact Support & Team Assistance</h2>
      <p>
        Our dedicated operations and customer support team is always available to resolve any technical questions, help you understand product features, or assist you with custom configurations.
      </p>
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mt-6">
        <p className="font-bold mb-2 text-[#0d0d0d]">Indian Business Kit Support & Help Desk</p>
        <p className="mb-1">📧 Email: <a href="mailto:info@indianbusinesskit.in" className="text-[#18E299] font-medium">info@indianbusinesskit.in</a></p>
        <p className="mb-1">📞 Helpline: 7020431433</p>
      </div>
    </LegalLayout>
  );
}
