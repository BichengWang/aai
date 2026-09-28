export type ProviderConfig = {
  apiKey: string;
  model: string;
  baseUrl: string;
};

const STORAGE_KEY = "review-provider-config";

export function loadProviderConfig(): ProviderConfig {
  if (typeof window === "undefined") {
    return emptyProviderConfig();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return emptyProviderConfig();
    }

    const parsed = JSON.parse(raw) as Partial<ProviderConfig>;

    const config = {
      apiKey: "",
      model: parsed.model ?? "",
      baseUrl: parsed.baseUrl ?? "",
    };

    if (Object.prototype.hasOwnProperty.call(parsed, "apiKey")) {
      saveProviderConfig(config);
    }

    return config;
  } catch {
    return emptyProviderConfig();
  }
}

export function saveProviderConfig(config: ProviderConfig) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      model: config.model,
      baseUrl: config.baseUrl,
    })
  );
}

export function clearProviderConfig() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function emptyProviderConfig(): ProviderConfig {
  return {
    apiKey: "",
    model: "",
    baseUrl: "",
  };
}
