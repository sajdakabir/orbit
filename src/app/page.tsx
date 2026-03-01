import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import SpacesShowcase from "@/components/spaces-showcase";
import Logos from "@/components/logos";
import HowItWorks from "@/components/how-it-works";
import Features from "@/components/features";
import ProductShowcase from "@/components/product-showcase";
import Integrations from "@/components/integrations";
import Bento from "@/components/bento";
import Faq from "@/components/faq";
import OpenSourceStats from "@/components/open-source-stats";
import Cta from "@/components/cta";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="max-w-[1280px] mx-auto border-x border-border">
        <Hero />
        <OpenSourceStats />
        <SpacesShowcase />
        {/* <Logos /> */}
        {/* <Features /> */}
        {/* <ProductShowcase /> */}
        {/* <HowItWorks /> */}
        <Integrations />
        {/* <Bento /> */}
        {/* <Faq /> */}
        <Cta />
      </div>
      <Footer />
    </>
  );
}
