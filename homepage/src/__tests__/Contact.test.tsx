import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Contact from "../components/Contact";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: null, profile: null }),
}));

describe("Contact form", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("announces success after submission", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url, options) => {
      const { submissionId } = JSON.parse(options.body);
      return Response.json({ ok: true, submissionId });
    }));
    const user = userEvent.setup();

    render(<Contact />);

    await user.type(screen.getByLabelText(/name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/email/i), "ada@example.com");
    await user.type(
      screen.getByLabelText(/send us what you need/i),
      "I need help with a local provider."
    );

    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(screen.getByRole("status")).toHaveTextContent(
      /your message has been sent to the altair team/i
    );
    expect(screen.getByRole("button", { name: /message sent/i })).toBeDisabled();
  });
});
