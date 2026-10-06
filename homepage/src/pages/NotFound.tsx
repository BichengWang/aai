import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageChrome";
import LabPageHead from "../components/lab/LabPageHead";

export default function NotFound() {
  usePageTitle("Page not found");
  return (
    <div className="lab-page">
      <LabPageHead
        kicker={["404", "Not found"]}
        title="This page is not on the chart."
        lede="The address may be mistyped, or the page may have moved."
        actions={
          <>
            <Link className="lab-btn lab-btn--primary" to="/">
              Back to home
            </Link>
            <Link className="lab-btn lab-btn--ghost" to="/services">
              Browse services
            </Link>
          </>
        }
      />
    </div>
  );
}
