import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Logos from "@/components/logos";
import HowItWorks from "@/components/how-it-works";
import Features from "@/components/features";
import ProductShowcase from "@/components/product-showcase";
import Integrations from "@/components/integrations";
import Bento from "@/components/bento";
import Faq from "@/components/faq";
import Cta from "@/components/cta";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      {/* <Logos /> */}
      <Features />
      <ProductShowcase />
      <HowItWorks />
      <Integrations />
      {/* <Bento /> */}
      {/* <Faq /> */}
      <Cta />
      <Footer />
    </>
  );
}
