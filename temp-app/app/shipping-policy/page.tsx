import { LegalLayout } from "@/components/shared/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.indianbusinesskit.in"),
  title: "Shipping & Delivery Policy - Indian Business Kit",
  description: "Shipping and delivery policy for digital products offered on Indian Business Kit.",
};

export default function ShippingPolicyPage() {
  return (
    <LegalLayout title="Shipping & Delivery" lastUpdated="May 14, 2026">
      <p className="text-lg">
        Thank you for choosing <strong>Indian Business Kit</strong> (operated by <strong>Western India Payment Services Private Limited</strong>).
      </p>
      <p className="mt-4">
        Since we operate strictly as a **Software-as-a-Service (SaaS)** cloud provider, all our platform functions, including Store Management, GST Invoicing, CRM, and AI modules, are purely digital assets. Consequently, our shipping framework is formulated as follows:
      </p>

      <hr className="my-8 border-gray-100" />

      <h2 className="text-2xl font-bold mb-4">1. Delivery of Digital Services</h2>
      <ul className="list-disc pl-6 mb-4 space-y-3">
        <li>
          <strong>No Physical Shipment:</strong> As a provider of digital software licenses and cloud subscriptions, we do not manufacture, store, or dispatch any physical products or hardcopy packages. Therefore, no physical shipping, logistics tracking, or courier delivery takes place.
        </li>
        <li>
          <strong>Instant Activation:</strong> Upon successful checkout and verification of payment by our secure aggregator, the provisioning of your SaaS portal occurs **instantly**. 
        </li>
        <li>
          <strong>Access Method:</strong> You will receive immediate confirmation and complete login access credentials directly via the **Registered Email Address** linked to your Clerk/OAuth profile. Alternatively, you will be redirected automatically to the production dashboard at <a href="https://inventory-management.indianbusinesskit.in" className="text-[#18E299] font-medium">https://inventory-management.indianbusinesskit.in</a>.
        </li>
      </ul> 

      <h2 className="text-2xl font-bold mt-8 mb-4">2. Expected Timeframes</h2>
      <div className="relative overflow-x-auto border border-gray-100 rounded-2xl">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-[#0d0d0d] uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Delivery Aspect</th>
              <th scope="col" className="px-6 py-3">Timeline</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white border-b border-gray-100">
              <td className="px-6 py-4 font-medium text-[#0d0d0d]">Subscription Activation</td>
              <td className="px-6 py-4">Instant (Real-Time)</td>
            </tr>
            <tr className="bg-white border-b border-gray-100">
              <td className="px-6 py-4 font-medium text-[#0d0d0d]">Email confirmation dispatch</td>
              <td className="px-6 py-4">Within 5 to 10 Minutes</td>
            </tr>
            <tr className="bg-white">
              <td className="px-6 py-4 font-medium text-[#0d0d0d]">Maximum Technical Hold (if any)</td>
              <td className="px-6 py-4">Up to 24 Hours</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">3. Delivery Failures & Technical Assistance</h2>
      <p>
        If your payment was completed, but you have not received your credentials or dashboard access within 30 minutes due to network outages, browser cache issues, or technical glitches, please get in touch with our operations team immediately for manual account provisioning.
      </p>
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mt-6">
        <p className="font-bold mb-2 text-[#0d0d0d]">Indian Business Kit Delivery Support</p>
        <p className="mb-1">📧 Help Desk: <a href="mailto:info@indianbusinesskit.in" className="text-[#18E299] font-medium">info@indianbusinesskit.in</a></p>
        <p className="mb-1">📞 Operations Hotline: 7020431433</p>
      </div>
    </LegalLayout>
  );
}
