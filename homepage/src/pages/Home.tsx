import Approach from "../components/Approach";
import { usePageTitle } from "../lib/usePageChrome";
import Contact from "../components/Contact";
import Coverage from "../components/Coverage";
import Faq from "../components/Faq";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import Offers from "../components/Offers";
import SocialProof from "../components/SocialProof";
import Systems from "../components/Systems";

export default function Home() {
  usePageTitle();
  return (
    <div className="lab-page">
      <Hero />
      <Approach />
      <Systems />
      <Offers />
      <HowItWorks />
      <Coverage />
      <SocialProof />
      <Faq />
      <Contact />
    </div>
  );
}
