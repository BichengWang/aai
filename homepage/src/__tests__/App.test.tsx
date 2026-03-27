import { render, screen } from "@testing-library/react";
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
        name: /local services, matched by ai/i,
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
  });
});
