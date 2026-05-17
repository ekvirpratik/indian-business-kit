import { Navbar } from "@/components/shared/navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { LightRays } from "@/components/ui/light-rays";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.indianbusinesskit.in"),
  title: "Contact Us - Indian Business Kit",
  description: "Reach out to the official Western India Payment Services team for Indian Business Kit inquiries, partnerships, or tech support.",
};

export default function ContactPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white text-[#0d0d0d] font-sans overflow-hidden">
      {/* Background Patterns */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <LightRays
          className="opacity-60"
          color="rgba(24, 226, 153, 0.3)"
          count={4}
        />
        <DotPattern
          className={cn(
            "mask-[radial-gradient(600px_circle_at_center,white,transparent)]",
            "absolute inset-0 opacity-40"
          )}
        />
      </div>

      <Navbar />

      <main className="relative z-10 grow pt-32 pb-24 px-6 md:px-12 lg:px-24 max-w-5xl mx-auto w-full">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center rounded-full border border-[#18E299]/30 bg-[#18E299]/10 px-3 py-1 text-xs font-medium text-[#13b77a] mb-4">
            Connect with us
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#0d0d0d] mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-gray-600">
            Have questions about subscription plans, API integrations, or dashboard features? Our expert support engineers are here to assist you.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8 items-start">
          {/* Contact Form (3 cols) */}
          <div className="md:col-span-3 bg-white border border-gray-100 shadow-2xl shadow-black/5 rounded-3xl p-8 md:p-10">
            <h2 className="text-2xl font-bold mb-6 text-[#0d0d0d]">Send a Message</h2>
            <form className="space-y-6" action="#">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Enter name"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-[#0d0d0d] focus:border-[#18E299] focus:ring-[#18E299] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="name@company.com"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-[#0d0d0d] focus:border-[#18E299] focus:ring-[#18E299] focus:outline-none transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Category</label>
                <select className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-[#0d0d0d] focus:border-[#18E299] focus:outline-none transition-colors">
                  <option>General Inquiry</option>
                  <option>Billing / Subscription Support</option>
                  <option>Technical Issue</option>
                  <option>Partnership Proposal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Describe your request</label>
                <textarea 
                  rows={5} 
                  required
                  placeholder="How can we help your business scale?"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-[#0d0d0d] focus:border-[#18E299] focus:outline-none transition-colors resize-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-[#0d0d0d] hover:bg-[#0d0d0d]/90 text-white font-bold rounded-xl text-center transition-all shadow-lg hover:shadow-black/10 active:scale-[0.98]"
              >
                Dispatch Message
              </button>
            </form>
          </div>

          {/* Legal & Address Info (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Official Info Card */}
            <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8">
              <h3 className="text-lg font-bold mb-4 text-[#0d0d0d]">Corporate Entity</h3>
              <p className="text-sm text-gray-600 font-medium leading-relaxed mb-4">
                Indian Business Kit is operated by:
              </p>
              <p className="text-base text-[#0d0d0d] font-bold mb-2">
                Western India Payment Services Private Limited
              </p>
              <div className="h-px bg-gray-200 w-full my-4"></div>
              
              <h4 className="text-sm font-bold mb-2 text-[#0d0d0d]">Corporate Identification</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Registered as a Private Limited Company in India.
              </p>
            </div>

            {/* Connect Card */}
            <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 space-y-4">
              <h3 className="text-lg font-bold text-[#0d0d0d] mb-2">Contact Information</h3>
              
              <div className="flex gap-3 items-start">
                <div className="text-xl shrink-0 mt-0.5">📧</div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Electronic Mail</h4>
                  <a href="mailto:info@indianbusinesskit.in" className="text-base font-semibold text-[#13b77a] hover:underline">
                    info@indianbusinesskit.in
                  </a>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="text-xl shrink-0 mt-0.5">📞</div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Telephone Support</h4>
                  <p className="text-base font-semibold text-[#0d0d0d]">
                    +91 7020431433
                  </p>
                  <p className="text-xs text-gray-500">Mon to Sat, 9 AM - 6 PM IST</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="text-xl shrink-0 mt-0.5">📍</div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Registered Office Address</h4>
                  <p className="text-sm font-semibold text-[#0d0d0d] leading-relaxed">
                    Western India Payment Services Private Limited<br />
                    [PLEASE FILL: Plot/Door No, Street Name]<br />
                    [PLEASE FILL: City, State, PIN Code]<br />
                    Maharashtra, India.
                  </p>
                  <p className="text-[11px] mt-2 font-semibold bg-[#18E299]/20 text-[#13b77a] px-2 py-1 rounded inline-block">
                    Action Required: Fill your physical address here!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
