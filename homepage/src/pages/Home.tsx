import { useEffect } from "react";
import Approach from "../components/Approach";
import Contact from "../components/Contact";
import Coverage from "../components/Coverage";
import Faq from "../components/Faq";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import Offers from "../components/Offers";
import SocialProof from "../components/SocialProof";
import Systems from "../components/Systems";

const HOME_THEME_COLOR = "#0b0c10";

export default function Home() {
  // The homepage opens on a dark plate; tint the browser chrome to match and
  // restore the light theme colour when navigating to other routes.
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) return;
    const previous = meta.content;
    meta.content = HOME_THEME_COLOR;
    return () => {
      meta.content = previous;
    };
  }, []);

  return (
    <div className="home-lab">
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
