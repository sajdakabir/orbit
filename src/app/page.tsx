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
import Testimonials from "@/components/testimonials";
import Cta from "@/components/cta";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <SpacesShowcase />
      <div className="max-w-[1280px] mx-auto border-x border-border">
        <OpenSourceStats />
        {/* <Logos /> */}
        {/* <Features /> */}
        {/* <ProductShowcase /> */}
        {/* <HowItWorks /> */}
        <Integrations />
        {/* <Bento /> */}
        {/* <Faq /> */}
        {/* <Testimonials /> */}
        <Cta />
      </div>
      <Footer />
    </>
  );
}
