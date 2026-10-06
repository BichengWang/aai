import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import App from "../App";

describe("Altair homepage", () => {
  it("renders key sections", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", {
        name: /applied ai for the services people rely on/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /services built for everyday needs/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start an enquiry/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /browse services/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /skip to content/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /primary/i })
    ).toBeInTheDocument();
    const primaryNav = screen.getByRole("navigation", { name: /primary/i });
    expect(within(primaryNav).getByRole("link", { name: "Workspace" })).toHaveAttribute(
      "href",
      "/?app=workspace"
    );
    expect(within(primaryNav).queryByRole("link", { name: "Review" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /qx@altairworld.com/i })
    ).toHaveAttribute("href", "mailto:qx@altairworld.com");
    expect(screen.getByRole("link", { name: "View live research" })).toHaveAttribute(
      "href",
      "/TradingAgents/"
    );
  });
});
