import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AppRoot from "../AppRoot";

vi.mock("../App", () => ({
  default: () => <div>marketing app</div>,
}));

vi.mock("../apps/WorkspaceApp", () => ({
  default: () => <div>workspace app</div>,
}));

function NavigateToWorkspace() {
  const navigate = useNavigate();

  return (
    <button type="button" onClick={() => navigate("/chat?app=workspace")}>
      Go workspace
    </button>
  );
}

describe("AppRoot", () => {
  it("switches to the workspace app when the router location changes", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/auth/callback"]}>
        <NavigateToWorkspace />
        <AppRoot />
      </MemoryRouter>
    );

    expect(screen.getByText("marketing app")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go workspace" }));

    expect(await screen.findByText("workspace app")).toBeInTheDocument();
  });
});
