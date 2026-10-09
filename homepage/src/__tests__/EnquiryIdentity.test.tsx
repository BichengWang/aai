import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import Contact from "../components/Contact";
import Enquiry from "../pages/Enquiry";
import type { AppUserProfile, AuthContextValue } from "../types/auth";

let auth: Pick<AuthContextValue, "user" | "profile">;
vi.mock("../context/AuthContext", () => ({ useAuth: () => auth }));

const account: User = {
  id: "member-1",
  aud: "authenticated",
  email: "member@example.com",
  user_metadata: { full_name: "Account Member" },
  app_metadata: {},
  created_at: "2026-10-08T00:00:00Z",
};
const profile: AppUserProfile = {
  user_id: account.id,
  email: account.email!,
  full_name: "Profile Member",
  avatar_url: null,
  auth_provider: "google",
  created_at: account.created_at,
  updated_at: account.created_at,
};

beforeEach(() => {
  auth = { user: null, profile: null };
  vi.stubGlobal("scrollTo", vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

describe.each([Contact, Enquiry])("account contact details in $name", (Form) => {
  function form() { return <MemoryRouter><Form /></MemoryRouter>; }

  it("fills details when login finishes and submits editable profile values", async () => {
    const fetchMock = vi.fn(async (_url, options) => {
      const { submissionId } = JSON.parse(options.body);
      return Response.json({ ok: true, submissionId });
    });
    vi.stubGlobal("fetch", fetchMock);
    const visitor = userEvent.setup();
    const { rerender } = render(form());
    expect(screen.getByLabelText("Name", { exact: true })).toHaveValue("");
    expect(screen.getByLabelText("Email", { exact: true })).toHaveValue("");

    auth = { user: account, profile: null };
    rerender(form());
    expect(screen.getByLabelText("Name", { exact: true })).toHaveValue("Account Member");
    expect(screen.getByLabelText("Email", { exact: true })).toHaveValue(account.email);

    auth = { user: account, profile };
    rerender(form());
    expect(screen.getByLabelText("Name", { exact: true })).toHaveValue("Profile Member");
    await visitor.clear(screen.getByLabelText("Email", { exact: true }));
    await visitor.type(screen.getByLabelText("Email", { exact: true }), "reply@example.com");
    if (Form === Contact) {
      await visitor.type(screen.getByLabelText("Send us what you need"), "Please help me find a provider.");
    }
    await visitor.click(screen.getByRole("button"));
    expect(screen.getByRole("status")).toHaveTextContent("has been sent");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      name: "Profile Member", email: "reply@example.com",
    });
  });

  it("preserves edits, including cleared fields, while the profile loads", async () => {
    auth = { user: account, profile: null };
    const visitor = userEvent.setup();
    const { rerender } = render(form());
    await visitor.clear(screen.getByLabelText("Name", { exact: true }));
    await visitor.type(screen.getByLabelText("Name", { exact: true }), "Custom Name");
    await visitor.clear(screen.getByLabelText("Email", { exact: true }));
    auth = { user: account, profile };
    rerender(form());
    expect(screen.getByLabelText("Name", { exact: true })).toHaveValue("Custom Name");
    expect(screen.getByLabelText("Email", { exact: true })).toHaveValue("");
  });

  it("clears previous account details on sign-out and ignores stale profiles on account changes", async () => {
    auth = { user: account, profile };
    const { rerender } = render(form());
    const visitor = userEvent.setup();
    await visitor.type(screen.getByLabelText("Name", { exact: true }), " edited");
    auth = { user: null, profile: null };
    rerender(form());
    expect(screen.getByLabelText("Name", { exact: true })).toHaveValue("");
    expect(screen.getByLabelText("Email", { exact: true })).toHaveValue("");

    auth = { user: { ...account, id: "member-2", email: "second@example.com", user_metadata: { name: "Second Member" } }, profile };
    rerender(form());
    expect(screen.getByLabelText("Name", { exact: true })).toHaveValue("Second Member");
    expect(screen.getByLabelText("Email", { exact: true })).toHaveValue("second@example.com");
  });
});
