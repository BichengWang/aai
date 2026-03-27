import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Contact from "../components/Contact";

describe("Contact form", () => {
  it("announces success after submission", async () => {
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
      /thanks! we received your message/i
    );
    expect(screen.getByRole("button", { name: /message sent/i })).toBeDisabled();
  });
});
