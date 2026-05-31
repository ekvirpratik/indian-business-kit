import Image from "next/image";
import Link from "next/link";

export function FooterSection() {
  return (
    <footer id="contact" className="relative z-10 w-full bg-[#0d0d0d] pt-20 pb-10 px-6 content-visibility-auto">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="relative flex size-12 md:size-16 items-center justify-center shrink-0">
                <Image src="/logo.png" alt="Indian Business Kit Logo" fill className="object-contain scale-125 md:scale-150" sizes="(max-width: 768px) 48px, 64px" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-white">Indian Business Kit</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              The all-in-one platform built specifically for Indian small businesses to manage billing, leads, and marketing.
            </p>
            <p className="text-white/40 text-xs mt-4 leading-relaxed">
              Indian Business Kit is a product owned and operated by <strong>Western India Payment Services Private Limited</strong>.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">Product</h4>
            <ul className="space-y-4">
              <li><a href="#features" className="text-white/60 hover:text-[#18E299] text-sm transition-colors">Features</a></li>
              <li><Link href="/pricing" className="text-white/60 hover:text-[#18E299] text-sm transition-colors">Pricing</Link></li>
              <li><a href="#" className="text-white/60 hover:text-[#18E299] text-sm transition-colors">Referral Program</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">Support</h4>
            <ul className="space-y-4">
              <li><Link href="/contact" className="text-white/60 hover:text-[#18E299] text-sm transition-colors">Contact Us</Link></li>
              <li><a href="#" className="text-white/60 hover:text-[#18E299] text-sm transition-colors">Help Center</a></li>
              <li><a href="#" className="text-white/60 hover:text-[#18E299] text-sm transition-colors">Documentation</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><Link href="/privacy-policy" className="text-white/60 hover:text-[#18E299] text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-white/60 hover:text-[#18E299] text-sm transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/refund-policy" className="text-white/60 hover:text-[#18E299] text-sm transition-colors">Refund & Cancellation</Link></li>
              <li><Link href="/shipping-policy" className="text-white/60 hover:text-[#18E299] text-sm transition-colors">Shipping & Delivery</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} Western India Payment Services Private Limited. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-white/40 hover:text-white transition-colors text-sm">Twitter</a>
            <a href="#" className="text-white/40 hover:text-white transition-colors text-sm">LinkedIn</a>
            <a href="#" className="text-white/40 hover:text-white transition-colors text-sm">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
