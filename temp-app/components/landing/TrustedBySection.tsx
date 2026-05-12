import { Marquee } from "@/components/ui/marquee";
import { Store, Briefcase, GraduationCap, Factory, Building2, ShoppingBag } from "lucide-react";

export function TrustedBySection() {
  return (
    <section className="relative z-10 w-full bg-white border-y border-black/5 py-12 overflow-hidden flex flex-col items-center">
      <h2 className="text-sm font-medium uppercase tracking-[0.65px] text-[#666666] mb-8">
        Trusted by Indian Small Businesses
      </h2>
      
      <div className="relative flex w-full max-w-5xl flex-row items-center justify-center overflow-hidden">
        <Marquee pauseOnHover className="[--duration:40s]">
          <div className="flex items-center gap-2 mx-8 text-[#0d0d0d] font-medium">
            <Store className="size-5 text-[#18E299]" /> Shop Owners
          </div>
          <div className="flex items-center gap-2 mx-8 text-[#0d0d0d] font-medium">
            <Briefcase className="size-5 text-[#18E299]" /> Freelancers
          </div>
          <div className="flex items-center gap-2 mx-8 text-[#0d0d0d] font-medium">
            <Building2 className="size-5 text-[#18E299]" /> Agencies
          </div>
          <div className="flex items-center gap-2 mx-8 text-[#0d0d0d] font-medium">
            <Factory className="size-5 text-[#18E299]" /> Small Manufacturers
          </div>
          <div className="flex items-center gap-2 mx-8 text-[#0d0d0d] font-medium">
            <GraduationCap className="size-5 text-[#18E299]" /> Education
          </div>
          <div className="flex items-center gap-2 mx-8 text-[#0d0d0d] font-medium">
            <ShoppingBag className="size-5 text-[#18E299]" /> Retail Shops
          </div>
        </Marquee>

        {/* Gradient Masks for Marquee */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-white"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-linear-to-l from-white"></div>
      </div>
    </section>
  );
}
