import { LegalLayout } from "@/components/shared/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.indianbusinesskit.in"),
  title: "Terms & Conditions - Indian Business Kit",
  description: "Terms and Conditions of usage for the Indian Business Kit software suite.",
};

export default function TermsAndConditionsPage() {
  return (
    <LegalLayout title="Terms & Conditions" lastUpdated="May 14, 2026">
      <p className="text-lg">
        Welcome to <strong>Indian Business Kit</strong>. These Terms and Conditions (&quot;Terms&quot;) govern your use of the website located at <a href="https://www.indianbusinesskit.in">www.indianbusinesskit.in</a> and the services, software, and applications provided by <strong>Western India Payment Services Private Limited</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
      </p>
      <p className="mt-4">
        By accessing or using our platform, products, and services, you agree to be bound by these Terms. If you do not agree with any part of these Terms, you must not use our platform.
      </p>

      <hr className="my-8 border-gray-100" />

      <h2 className="text-2xl font-bold mb-4">1. Services Provided</h2>
      <p>
        Indian Business Kit is an all-in-one digital Business Management System offering features such as:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-2 mt-2">
        <li>Inventory & Store Management</li>
        <li>Billing & GST Invoice Generation</li>
        <li>Client Relationship Management (CRM)</li>
        <li>Expense Tracking & Business Analytics</li>
        <li>Digital Marketing & AI Assistance Tools</li>
      </ul>
      <p>
        We reserve the right to modify, upgrade, or discontinue any feature of the platform at our sole discretion, with or without prior notice.
      </p>

      <h2 className="text-2xl font-bold mt-8 mb-4">2. User Eligibility & Accounts</h2>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>To use our platform, you must be at least 18 years old and competent to contract under Indian laws.</li>
        <li>You are responsible for maintaining the confidentiality of your account credentials (Clerk login / OAuth providers).</li>
        <li>You agree that any information you provide during registration and checkout is accurate, complete, and current.</li>
        <li>We reserve the right to terminate or suspend accounts that violate these terms or indulge in unauthorized activities.</li>
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">3. Fees and Subscription Payments</h2>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>Our platform operates on a subscription basis. Detailed pricing plans are listed on our official <a href="/pricing">Pricing Page</a>.</li>
        <li>Payments are securely processed via authorized, PCI-compliant payment aggregators (such as Cashfree Payments).</li>
        <li>All statutory taxes, including GST, are applicable as per existing Indian taxation laws and will be added to the billing amount.</li>
        <li>Upon receipt of confirmation of payment, your subscription account is automatically authorized, and full dashboard access is unlocked.</li>
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">4. Acceptable Use & Restrictions</h2>
      <p>You agree NOT to use the Indian Business Kit platform to:</p>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>Violate any local, state, national, or international laws or regulations (including tax compliance and data privacy laws).</li>
        <li>Modify, adapt, disassemble, reverse engineer, or clone any part of our proprietary codebase, source code, or user interfaces.</li>
        <li>Upload malicious scripts, viruses, trojans, or perform DoS attacks targeting our cloud infrastructures.</li>
        <li>Misrepresent identity, commit fraudulent transactions, or conduct unauthorized commercial practices.</li>
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">5. Intellectual Property Rights</h2>
      <p>
        All logos, source code, graphics, platform architecture, database schemas, UI/UX, and trademarks associated with the brand &quot;Indian Business Kit&quot; remain the exclusive intellectual property of <strong>Western India Payment Services Private Limited</strong>. Users do not acquire any ownership or licensing rights beyond the basic SaaS subscription permit granted under active payment tiers.
      </p>

      <h2 className="text-2xl font-bold mt-8 mb-4">6. Limitation of Liability</h2>
      <p>
        The platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. To the maximum extent permitted by Indian Law, Western India Payment Services Private Limited shall not be held liable for any indirect, incidental, special, consequential, or punitive damages, or loss of data, profits, or revenue arising out of your use of the Billing, GST, or Database synchronization functions.
      </p>

      <h2 className="text-2xl font-bold mt-8 mb-4">7. Dispute Resolution & Jurisdiction</h2>
      <p>
        These Terms and Conditions shall be governed by and interpreted in accordance with the laws of India. Any disputes, controversies, or claims arising out of your relationship with Western India Payment Services Private Limited shall be subject to the exclusive jurisdiction of the courts located in **Mumbai, Maharashtra, India**.
      </p>

      <h2 className="text-2xl font-bold mt-8 mb-4">8. Contact Information</h2>
      <p>If you have any questions or require legal clarifications regarding these terms, please feel free to reach out to our legal compliance cell:</p>
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mt-4">
        <p className="font-bold mb-2 text-[#0d0d0d]">Western India Payment Services Private Limited</p>
        <p className="mb-1">📧 Email: <a href="mailto:info@indianbusinesskit.in" className="text-[#18E299] font-medium">info@indianbusinesskit.in</a></p>
        <p className="mb-1">📞 Phone: 7020431433</p>
      </div>
    </LegalLayout>
  );
}
