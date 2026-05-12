import { X, CheckCircle2 } from "lucide-react";

export function FeaturesSection() {
  return (
    <section id="features" className="relative z-10 w-full bg-[#fafafa] py-24 px-6 border-b border-black/5 content-visibility-auto">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-[#0d0d0d] mb-4">
            Why upgrade to Indian Business Kit?
          </h2>
          <p className="text-[#666666] text-lg max-w-2xl mx-auto">
            Move beyond the chaos of manual management. It&apos;s time to run your business the smart, automated way.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 relative">
          {/* VS Badge in the center for desktop */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 size-12 items-center justify-center rounded-full bg-white border border-black/10 shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-sm font-black text-[#0d0d0d]">
            VS
          </div>

          {/* Problem Card */}
          <div className="group rounded-[24px] border border-black/5 bg-white p-8 md:p-10 shadow-sm hover:shadow-xl hover:border-red-100 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-red-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="mb-8 flex items-center gap-4 relative z-10">
              <div className="flex size-14 items-center justify-center rounded-full bg-red-50 text-red-500 group-hover:scale-110 group-hover:bg-red-100 transition-all duration-300 shadow-sm">
                <X className="size-7" />
              </div>
              <h3 className="text-2xl font-bold text-[#0d0d0d]">The &quot;Jugaad&quot; Way</h3>
            </div>
            
            <ul className="space-y-6 relative z-10">
              <li className="flex items-start gap-4 text-[#666666] group-hover:text-[#0d0d0d]/80 transition-colors">
                <X className="size-5 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-[15px]">Lost leads in messy WhatsApp chats and scattered sticky notes</span>
              </li>
              <li className="flex items-start gap-4 text-[#666666] group-hover:text-[#0d0d0d]/80 transition-colors">
                <X className="size-5 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-[15px]">Manual billing takes hours, looks unprofessional, and leads to mistakes</span>
              </li>
              <li className="flex items-start gap-4 text-[#666666] group-hover:text-[#0d0d0d]/80 transition-colors">
                <X className="size-5 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-[15px]">No automated followup system for pending payments and bad debts</span>
              </li>
              <li className="flex items-start gap-4 text-[#666666] group-hover:text-[#0d0d0d]/80 transition-colors">
                <X className="size-5 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-[15px]">Marketing confusion with zero professional tools or strategy</span>
              </li>
            </ul>
          </div>

          {/* Solution Card */}
          <div className="group rounded-[24px] border-2 border-[#18E299] bg-white p-8 md:p-10 shadow-[0_8px_24px_rgba(24,226,153,0.12)] hover:shadow-[0_20px_40px_rgba(24,226,153,0.2)] relative overflow-hidden transition-all duration-500 hover:-translate-y-2">
            <div className="absolute inset-0 bg-linear-to-br from-[#18E299]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="absolute top-0 right-0 bg-[#18E299] text-[#0d0d0d] text-xs font-bold px-4 py-1.5 rounded-bl-lg uppercase tracking-wider shadow-sm">
              The Smart Way
            </div>
            
            <div className="mb-8 flex items-center gap-4 relative z-10">
              <div className="flex size-14 items-center justify-center rounded-full bg-[#18E299]/10 text-[#18E299] group-hover:scale-110 group-hover:bg-[#18E299] group-hover:text-[#0d0d0d] transition-all duration-300 shadow-sm">
                <CheckCircle2 className="size-7" />
              </div>
              <h3 className="text-2xl font-bold text-[#0d0d0d]">Indian Business Kit</h3>
            </div>
            
            <ul className="space-y-6 relative z-10">
              <li className="flex items-start gap-4 text-[#0d0d0d] font-medium">
                <div className="mt-0.5 rounded-full bg-[#18E299]/20 p-1 group-hover:bg-[#18E299] transition-colors duration-300">
                  <CheckCircle2 className="size-4 text-[#18E299] group-hover:text-[#0d0d0d]" />
                </div>
                <span className="leading-relaxed text-[15px]">Professional GST Billing completed in seconds with zero errors</span>
              </li>
              <li className="flex items-start gap-4 text-[#0d0d0d] font-medium">
                <div className="mt-0.5 rounded-full bg-[#18E299]/20 p-1 group-hover:bg-[#18E299] transition-colors duration-300">
                  <CheckCircle2 className="size-4 text-[#18E299] group-hover:text-[#0d0d0d]" />
                </div>
                <span className="leading-relaxed text-[15px]">Smart CRM Lead Manager to track and convert every potential client</span>
              </li>
              <li className="flex items-start gap-4 text-[#0d0d0d] font-medium">
                <div className="mt-0.5 rounded-full bg-[#18E299]/20 p-1 group-hover:bg-[#18E299] transition-colors duration-300">
                  <CheckCircle2 className="size-4 text-[#18E299] group-hover:text-[#0d0d0d]" />
                </div>
                <span className="leading-relaxed text-[15px]">Automated payment reminders and WhatsApp followups</span>
              </li>
              <li className="flex items-start gap-4 text-[#0d0d0d] font-medium">
                <div className="mt-0.5 rounded-full bg-[#18E299]/20 p-1 group-hover:bg-[#18E299] transition-colors duration-300">
                  <CheckCircle2 className="size-4 text-[#18E299] group-hover:text-[#0d0d0d]" />
                </div>
                <span className="leading-relaxed text-[15px]">AI Marketing tools to grow your brand and reach new customers automatically</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
