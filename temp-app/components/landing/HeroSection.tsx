import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroSection() {
  return (
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center min-h-[85vh] pt-48 md:pt-56 px-6 pb-32">
      <div className="relative inline-flex items-center rounded-full bg-linear-to-b from-white/80 to-white/30 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_0_rgba(0,0,0,0.08),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(255,255,255,0.4)] px-4 py-1.5 mb-8 overflow-hidden">
        {/* Glass Glare Reflection */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-white/60 to-transparent rounded-t-full pointer-events-none"></div>
        
        <span className="relative flex size-2.5 rounded-full bg-[#18E299] mr-2 shadow-[0_0_12px_rgba(24,226,153,0.9)]"></span>
        <span className="relative text-xs font-bold uppercase tracking-[0.8px] text-[#0d0d0d] drop-shadow-sm">
          Billing + CRM + AI Marketing + Digital Guidance+ Mini HR Employee Tracking
        </span>
      </div>

      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-[-1.28px] text-center mb-6 max-w-4xl leading-[1.15]">
        The Ultimate Growth Engine<br />for Indian Businesses
      </h1>
      
      <p className="text-lg md:text-xl text-[#666666] text-center mb-10 max-w-2xl leading-relaxed">
        Stop running your business on <i>jugaad</i>. Say goodbye to messy WhatsApp chats and Excel errors. Manage your GST billing, leads, and marketing from one professional dashboard.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link href="/pricing">
          <Button className="rounded-full bg-[#18E299] text-[#0d0d0d] px-8 h-12 text-[15px] font-medium hover:bg-[#15c586] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
            Launch Offer ₹239/month
          </Button>
        </Link>
        <Link href="/pricing">
          <Button variant="outline" className="rounded-full border-black/8 px-8 h-12 text-[15px] font-medium bg-white hover:bg-black/4 text-[#0d0d0d]">
            Watch Demo
          </Button>
        </Link>
      </div>
    </main>
  );
}
