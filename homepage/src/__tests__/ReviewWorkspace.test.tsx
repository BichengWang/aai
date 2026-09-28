import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import * as docxPreview from "docx-preview";
import JSZip from "jszip";

vi.mock("docx-preview", () => ({
  renderAsync: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));

const mockedDocxPreview = vi.mocked(docxPreview);

describe("Review workspace", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    const storage = createStorageMock();

    vi.stubGlobal("localStorage", storage);
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: storage,
    });

    window.localStorage.clear();
    mockedDocxPreview.renderAsync.mockReset();
    mockedDocxPreview.renderAsync.mockImplementation(async (_data, container) => {
      container.innerHTML = `
        <div class="review-docx-wrapper">
          <section class="review-docx">
            <p>Master Services Agreement</p>
            <p>Vendor will respond within two business days.</p>
            <p>Payment will be due within 30 days.</p>
          </section>
        </div>
      `;
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uploads a docx and uses highlighted text as chat context", async () => {
    renderReviewWorkspace();

    await userEvent.setup().upload(
      await screen.findByLabelText(/upload a docx file/i),
      await createDocxFile()
    );

    await screen.findByText(/payment will be due within 30 days\./i);

    selectRenderedText("Payment will be due within 30 days.");

    expect(screen.getByText(/^using selection$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/payment will be due within 30 days\./i).length).toBeGreaterThan(1);
  });

  it("shows an actionable error when docx rendering fails", async () => {
    const user = userEvent.setup();

    mockedDocxPreview.renderAsync.mockRejectedValue(new Error("Unreadable file"));

    renderReviewWorkspace();

    await user.upload(
      await screen.findByLabelText(/upload a docx file/i),
      await createDocxFile()
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Unreadable file");
  });

  it("disables submit until text is highlighted and a key exists", async () => {
    vi.stubEnv("VITE_ANTHROPIC_API_KEY", "");

    renderReviewWorkspace();

    expect(
      await screen.findByRole("button", { name: /ask agent/i })
    ).toBeDisabled();
  });

  it("keeps a pasted api key in memory without saving it", async () => {
    const user = userEvent.setup();
    vi.stubEnv("VITE_ANTHROPIC_API_KEY", "");

    renderReviewWorkspace("/review/settings");

    await screen.findByRole("dialog", { name: /connection settings/i });
    await user.type(
      await screen.findByLabelText(/compatible api key/i),
      "typed-test-key"
    );
    await user.type(await screen.findByLabelText(/^model$/i), "gpt-5.4");
    await user.type(
      await screen.findByLabelText(/base url/i),
      "https://api.openai.com/v1"
    );
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    expect(screen.getByText(/^model and base url saved for this browser/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/compatible api key/i)).toHaveValue(
      "typed-test-key"
    );
    expect(
      JSON.parse(window.localStorage.getItem("review-provider-config") ?? "{}")
    ).toEqual({
      model: "gpt-5.4",
      baseUrl: "https://api.openai.com/v1",
    });
  });

  it("removes a key saved by an older version on load", async () => {
    window.localStorage.setItem(
      "review-provider-config",
      JSON.stringify({
        apiKey: "legacy-test-key",
        model: "gpt-5.4",
        baseUrl: "https://api.openai.com/v1",
      })
    );

    renderReviewWorkspace("/review/settings");

    expect(await screen.findByLabelText(/compatible api key/i)).toHaveValue("");
    expect(screen.getByLabelText(/^model$/i)).toHaveValue("gpt-5.4");
    expect(
      JSON.parse(window.localStorage.getItem("review-provider-config") ?? "{}")
    ).toEqual({
      model: "gpt-5.4",
      baseUrl: "https://api.openai.com/v1",
    });
  });

  it("uses the env key as a fallback", async () => {
    const user = userEvent.setup();
    vi.stubEnv("VITE_ANTHROPIC_API_KEY", "env-test-key");
    vi.stubEnv("VITE_ANTHROPIC_MODEL", "gpt-5.4");

    renderReviewWorkspace();

    await user.upload(
      await screen.findByLabelText(/upload a docx file/i),
      await createDocxFile()
    );
    await screen.findByText(/payment will be due within 30 days\./i);

    selectRenderedText("Payment will be due within 30 days.");
    await user.type(
      await screen.findByLabelText(/ask about the selected clause/i),
      "Does the env config enable chat?"
    );

    expect(
      screen.getByRole("button", { name: /ask agent/i })
    ).toBeEnabled();
  });

  it("switches to anthropic compatibility defaults when only an anthropic env key is present", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    vi.stubEnv("VITE_LLM_API_KEY", "");
    vi.stubEnv("VITE_LLM_MODEL", "");
    vi.stubEnv("VITE_LLM_BASE_URL", "");
    vi.stubEnv("VITE_OPENAI_COMPAT_BASE_URL", "");
    vi.stubEnv("VITE_ANTHROPIC_API_KEY", "sk-ant-test-key");
    vi.stubEnv("VITE_ANTHROPIC_MODEL", "");
    vi.stubEnv("VITE_ANTHROPIC_API_URL", "");

    fetchMock.mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          choices: [
            {
              message: {
                content: "The clause allows termination with notice.",
              },
            },
          ],
        }),
    } as Response);

    renderReviewWorkspace();

    await user.upload(
      await screen.findByLabelText(/upload a docx file/i),
      await createDocxFile()
    );
    await screen.findByText(/payment will be due within 30 days\./i);

    selectRenderedText("Payment will be due within 30 days.");
    await user.type(
      await screen.findByLabelText(/ask about the selected clause/i),
      "What does this clause do?"
    );
    await user.click(screen.getByRole("button", { name: /ask agent/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/chat/completions",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer sk-ant-test-key",
        }),
        body: expect.stringContaining('"model":"claude-sonnet-4-20250514"'),
      })
    );
  });

  it("sends the highlighted excerpt and question to a compatible api", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    vi.stubEnv("VITE_LLM_API_KEY", "");
    vi.stubEnv("VITE_ANTHROPIC_API_KEY", "");
    vi.stubEnv("VITE_LLM_MODEL", "");
    vi.stubEnv("VITE_ANTHROPIC_MODEL", "");

    fetchMock.mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          choices: [
            {
              message: {
                content: "The clause creates a 30-day payment obligation.",
              },
            },
          ],
        }),
    } as Response);

    saveProviderSettings();
    renderReviewWorkspace();

    await user.upload(
      await screen.findByLabelText(/upload a docx file/i),
      await createDocxFile()
    );
    await screen.findByText(/payment will be due within 30 days\./i);

    selectRenderedText("Payment will be due within 30 days.");

    await user.type(
      await screen.findByLabelText(/ask about the selected clause/i),
      "What obligation does this create?"
    );
    await user.click(screen.getByRole("button", { name: /ask agent/i }));

    expect(
      await screen.findByText(/30-day payment obligation/i)
    ).toBeInTheDocument();

    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(request.messages.at(-1).content).toContain(
      "Payment will be due within 30 days."
    );
    expect(request.messages.at(-1).content).toContain(
      "Document context:"
    );
    expect(request.messages.at(-1).content).toContain(
      "Master Services Agreement"
    );
    expect(request.messages.at(-1).content).toContain(
      "Vendor will respond within two business days."
    );
    expect(request.messages.at(-1).content).toContain("Relevant chunks:");
    expect(request.messages.at(-1).content).toContain(
      "What obligation does this create?"
    );
    expect(request.model).toBe("gpt-5.4");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer typed-test-key",
        }),
      })
    );
  });

  
  it("preserves selected clause context across follow-up turns", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            choices: [
              {
                message: {
                  content: "The clause sets a 30-day payment deadline.",
                },
              },
            ],
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            choices: [
              {
                message: {
                  content: "It does not conflict with the response-time clause.",
                },
              },
            ],
          }),
      } as Response);

    saveProviderSettings();
    renderReviewWorkspace();

    await user.upload(
      await screen.findByLabelText(/upload a docx file/i),
      await createDocxFile()
    );
    await screen.findByText(/payment will be due within 30 days\./i);

    selectRenderedText("Payment will be due within 30 days.");
    await user.type(
      await screen.findByLabelText(/ask about the selected clause/i),
      "What obligation does this create?"
    );
    await user.click(screen.getByRole("button", { name: /ask agent/i }));

    expect(
      await screen.findByText(/30-day payment deadline/i)
    ).toBeInTheDocument();

    await user.type(
      await screen.findByLabelText(/ask about the selected clause/i),
      "Does that conflict with the response-time clause?"
    );
    await user.click(screen.getByRole("button", { name: /ask agent/i }));

    expect(
      await screen.findByText(/does not conflict with the response-time clause/i)
    ).toBeInTheDocument();

    const secondRequest = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(secondRequest.messages[1].content).toContain(
      "Selected excerpt for this turn:"
    );
    expect(secondRequest.messages[1].content).toContain(
      "Payment will be due within 30 days."
    );
    expect(secondRequest.messages.at(-1).content).toContain(
      "Does that conflict with the response-time clause?"
    );
  });

  it("normalizes the bare openai api root to the v1 chat endpoint", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          choices: [
            {
              message: {
                content: "The clause creates a 30-day payment obligation.",
              },
            },
          ],
        }),
    } as Response);

    window.localStorage.setItem(
      "review-provider-config",
      JSON.stringify({
        model: "gpt-5.4",
        baseUrl: "https://api.openai.com",
      })
    );
    vi.stubEnv("VITE_LLM_API_KEY", "typed-test-key");

    renderReviewWorkspace();

    await user.upload(
      await screen.findByLabelText(/upload a docx file/i),
      await createDocxFile()
    );
    await screen.findByText(/payment will be due within 30 days\./i);

    selectRenderedText("Payment will be due within 30 days.");
    await user.type(
      await screen.findByLabelText(/ask about the selected clause/i),
      "What obligation does this create?"
    );
    await user.click(screen.getByRole("button", { name: /ask agent/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.any(Object)
    );
  });

  it("submits on Enter and preserves Shift+Enter for a newline", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          choices: [
            {
              message: {
                content: "Payment is due within 30 days.",
              },
            },
          ],
        }),
    } as Response);

    saveProviderSettings();
    renderReviewWorkspace();

    await user.upload(
      await screen.findByLabelText(/upload a docx file/i),
      await createDocxFile()
    );
    await screen.findByText(/payment will be due within 30 days\./i);

    selectRenderedText("Payment will be due within 30 days.");

    const textarea = await screen.findByLabelText(/ask about the selected clause/i);
    await user.type(textarea, "Line one");
    await user.keyboard("{Shift>}{Enter}{/Shift}Line two");
    expect(textarea).toHaveValue("Line one\nLine two");

    await user.keyboard("{Enter}");

    expect(
      await screen.findByText(/payment is due within 30 days\./i)
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows a clear error when the base url returns html instead of json", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue({
      ok: false,
      text: async () => "<html><body>Not found</body></html>",
    } as Response);

    saveProviderSettings();
    renderReviewWorkspace();

    await user.upload(
      await screen.findByLabelText(/upload a docx file/i),
      await createDocxFile()
    );
    await screen.findByText(/payment will be due within 30 days\./i);

    selectRenderedText("Payment will be due within 30 days.");

    const textarea = await screen.findByLabelText(/ask about the selected clause/i);
    await user.type(textarea, "What risk does this create?");
    await user.click(screen.getByRole("button", { name: /ask agent/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /returned html instead of json/i
    );
    await waitFor(() => {
      expect(textarea).toHaveValue("What risk does this create?");
    });
  });

  it("explains when the browser origin is blocked by anthropic's compatibility api", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    vi.stubEnv("VITE_LLM_API_KEY", "");
    vi.stubEnv("VITE_LLM_MODEL", "");
    vi.stubEnv("VITE_LLM_BASE_URL", "");
    vi.stubEnv("VITE_OPENAI_COMPAT_BASE_URL", "");
    vi.stubEnv("VITE_ANTHROPIC_API_KEY", "sk-ant-test-key");
    vi.stubEnv("VITE_ANTHROPIC_MODEL", "");
    vi.stubEnv("VITE_ANTHROPIC_API_URL", "https://api.anthropic.com/v1");

    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    renderReviewWorkspace();

    await user.upload(
      await screen.findByLabelText(/upload a docx file/i),
      await createDocxFile()
    );
    await screen.findByText(/payment will be due within 30 days\./i);

    selectRenderedText("Payment will be due within 30 days.");

    const textarea = await screen.findByLabelText(/ask about the selected clause/i);
    await user.type(textarea, "What risk does this create?");
    await user.click(screen.getByRole("button", { name: /ask agent/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /blocked from calling anthropic's compatibility api directly from the browser/i
    );
  });

  it("shows a chat error and restores the draft when the compatible api returns an error", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue({
      ok: false,
      text: async () =>
        JSON.stringify({
          error: {
            message: "Invalid API key",
          },
        }),
    } as Response);

    saveProviderSettings();
    renderReviewWorkspace();

    await user.upload(
      await screen.findByLabelText(/upload a docx file/i),
      await createDocxFile()
    );
    await screen.findByText(/payment will be due within 30 days\./i);

    selectRenderedText("Payment will be due within 30 days.");

    const textarea = await screen.findByLabelText(/ask about the selected clause/i);
    await user.type(textarea, "What risk does this create?");
    await user.click(screen.getByRole("button", { name: /ask agent/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid API key");
    await waitFor(() => {
      expect(textarea).toHaveValue("What risk does this create?");
    });
  });
});

function renderReviewWorkspace(initialEntry = "/review") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>
  );
}

async function createDocxFile() {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8"?>
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
        <Default Extension="xml" ContentType="application/xml"/>
        <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
      </Types>`
  );
  zip.folder("_rels")?.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship
          Id="rId1"
          Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
          Target="word/document.xml"
        />
      </Relationships>`
  );
  zip.folder("word")?.file(
    "document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p><w:r><w:t>Master Services Agreement</w:t></w:r></w:p>
          <w:p><w:r><w:t>Vendor will respond within two business days.</w:t></w:r></w:p>
          <w:p><w:r><w:t>Payment will be due within 30 days.</w:t></w:r></w:p>
        </w:body>
      </w:document>`
  );

  const buffer = await zip.generateAsync({ type: "arraybuffer" });

  return new File([buffer], "contract.docx", {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

function selectRenderedText(text: string) {
  const viewer = screen.getByLabelText(/rendered docx preview/i);
  const target = within(viewer).getByText(text);
  const range = document.createRange();
  const selection = window.getSelection();

  range.selectNodeContents(target);
  selection?.removeAllRanges();
  selection?.addRange(range);
  fireEvent.mouseUp(viewer);
}

function saveProviderSettings() {
  vi.stubEnv("VITE_LLM_API_KEY", "typed-test-key");
  window.localStorage.setItem(
    "review-provider-config",
    JSON.stringify({
      model: "gpt-5.4",
      baseUrl: "https://api.openai.com/v1",
    })
  );
}

function createStorageMock() {
  let store = new Map<string, string>();

  return {
    clear: () => {
      store = new Map<string, string>();
    },
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    get length() {
      return store.size;
    },
  };
}
