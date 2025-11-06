"use client";
import HeroSection from "../components/HeroSection";
import WhatWeOffer from "../components/WhatWeOffer";
import HowItWorks from "../components/HowItWorks";
import WhyChooseUs from "../components/WhyChooseUs";
import Testimonials from "../components/Testimonials";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="bg-white text-black">
      <HeroSection />
      <WhatWeOffer />
      <HowItWorks />
      <WhyChooseUs />
      <Testimonials />
      <CTA />
      {/* Footer is rendered globally in the root layout */}
    </div>
  );
}
