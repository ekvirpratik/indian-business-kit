import { Navbar } from "@/components/shared/navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { LightRays } from "@/components/ui/light-rays";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-white text-[#0d0d0d] font-sans overflow-hidden">
      {/* Background Patterns */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <LightRays
          className="opacity-50"
          color="rgba(24, 226, 153, 0.3)"
          count={3}
        />
        <DotPattern
          className={cn(
            "mask-[radial-gradient(500px_circle_at_center,white,transparent)]",
            "absolute inset-0 opacity-40"
          )}
        />
      </div>

      <Navbar />

      <main className="relative z-10 grow pt-32 pb-24 px-6 md:px-12 lg:px-24 max-w-4xl mx-auto w-full">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center rounded-full border border-[#18E299]/30 bg-[#18E299]/10 px-3 py-1 text-xs font-medium text-[#13b77a] mb-4">
            Official Documentation
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#0d0d0d] mb-4">
            {title}
          </h1>
          <p className="text-sm text-gray-500">
            Last Updated: {lastUpdated}
          </p>
        </div>

        <div className="bg-white border border-gray-100 shadow-2xl shadow-black/5 rounded-3xl p-8 md:p-12 prose prose-lg max-w-none prose-headings:text-[#0d0d0d] prose-p:text-gray-600 prose-strong:text-[#0d0d0d] prose-li:text-gray-600 prose-a:text-[#18E299] hover:prose-a:text-[#13b77a]">
          {children}
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
