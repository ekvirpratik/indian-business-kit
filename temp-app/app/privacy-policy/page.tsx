import { LegalLayout } from "@/components/shared/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.indianbusinesskit.in"),
  title: "Privacy Policy - Indian Business Kit",
  description: "Privacy Policy for Indian Business Kit, operated by Western India Payment Services Private Limited.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="May 07, 2026">
      <p className="text-lg">
        <strong>Indian Business Kit</strong> is a product operated by <strong>Western India Payment Services Private Limited</strong> (“Company”, “we”, “our”, “us”). We are committed to protecting your privacy and ensuring that your personal information is handled securely.
      </p>

      <hr className="my-8 border-gray-100" />

      <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
      <p>We may collect the following types of information:</p>
      <h3 className="text-xl font-semibold mt-4 mb-2">Personal Information</h3>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>Name</li>
        <li>Email address</li>
        <li>Phone number</li>
        <li>Business details (if provided)</li>
      </ul>
      <h3 className="text-xl font-semibold mt-4 mb-2">Usage Data</h3>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>Pages visited</li>
        <li>Features used (Billing, CRM, AI tools, etc.)</li>
        <li>Device and browser information</li>
      </ul>
      <h3 className="text-xl font-semibold mt-4 mb-2">Payment Information</h3>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>Payments are processed securely through third-party payment gateways (Cashfree)</li>
        <li>We do not store your card or banking details directly on our servers</li>
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>Provide access to our services (Billing, CRM, AI Marketing Tools, etc.)</li>
        <li>Improve platform performance and user experience</li>
        <li>Send updates, offers, and important notifications</li>
        <li>Provide customer support</li>
        <li>Ensure security and prevent fraud</li>
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">3. Data Sharing</h2>
      <p>We do not sell your personal data. We may share information with:</p>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>Payment gateway providers for secure transactions</li>
        <li>Hosting and technology partners for operating the platform</li>
        <li>Legal authorities (if mandated by law)</li>
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">4. Data Security</h2>
      <p>
        We implement reasonable technical and organizational measures to protect your data. However, no system is completely secure, and we cannot guarantee absolute security.
      </p>

      <h2 className="text-2xl font-bold mt-8 mb-4">5. Cookies</h2>
      <p>We may use cookies to:</p>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>Enhance user experience</li>
        <li>Analyze website performance</li>
        <li>Understand user behavior</li>
      </ul>
      <p>You can disable cookies through your browser settings.</p>

      <h2 className="text-2xl font-bold mt-8 mb-4">6. User Rights</h2>
      <p>You have the right to:</p>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>Access your personal data</li>
        <li>Request correction of your data</li>
        <li>Request deletion of your account</li>
      </ul>
      <p>To exercise these rights, please contact us using the information below.</p>

      <h2 className="text-2xl font-bold mt-8 mb-4">7. Third-Party Links</h2>
      <p>
        Our platform may contain links to third-party websites. We are not responsible for their privacy practices or content.
      </p>

      <h2 className="text-2xl font-bold mt-8 mb-4">8. Policy Updates</h2>
      <p>
        We may update this Privacy Policy at any time. Changes will be posted on this page. Continued use of our services indicates your acceptance of the updated policy.
      </p>

      <h2 className="text-2xl font-bold mt-8 mb-4">9. Contact Information</h2>
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
        <p className="font-bold mb-2 text-[#0d0d0d]">Western India Payment Services Private Limited</p>
        <p className="mb-1">📧 Email: <a href="mailto:info@indianbusinesskit.in" className="text-[#18E299] font-medium">info@indianbusinesskit.in</a></p>
        <p className="mb-1">📞 Phone: 7020431433</p>
      </div>

      <p className="mt-8 text-sm text-gray-500 italic">
        By using indianbusinesskit.in, you agree to this Privacy Policy.
      </p>
    </LegalLayout>
  );
}
