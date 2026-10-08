import { Countdown } from "@/components/home/Countdown";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Hero } from "@/components/home/Hero";
import { Lookbook } from "@/components/home/Lookbook";
import { Manifesto } from "@/components/home/Manifesto";

export default function Home() {
  return (
    <>
      <Hero />
      <Countdown />
      <FeaturedProducts />
      <Lookbook />
      <Manifesto />
    </>
  );
}
