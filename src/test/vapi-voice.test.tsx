import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VapiVoiceAssistant } from "@/components/VapiVoiceAssistant";

const mocks = vi.hoisted(() => {
  const handlers = new Map<string, (...args: unknown[]) => void>();
  return {
    handlers,
    start: vi.fn(), stop: vi.fn().mockResolvedValue(undefined),
    on: vi.fn((name: string, fn: (...args: unknown[]) => void) => handlers.set(name, fn)),
    removeListener: vi.fn((name: string) => handlers.delete(name)),
  };
});
vi.mock("@vapi-ai/web", () => ({
  default: class { start = mocks.start; stop = mocks.stop; on = mocks.on; removeListener = mocks.removeListener; },
}));

beforeEach(() => {
  vi.clearAllMocks(); mocks.handlers.clear(); mocks.start.mockResolvedValue({ id: "test-call" });
  vi.stubEnv("VITE_VAPI_PUBLIC_KEY", "test-public-key");
  vi.stubEnv("VITE_VAPI_ASSISTANT_ID", "2dd590e3-2908-4d81-bd14-da07b424c62f");
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn() } });
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

async function openAndStart() {
  render(<VapiVoiceAssistant />);
  fireEvent.click(screen.getByRole("button", { name: "Talk to Saffan AI" }));
  fireEvent.click(screen.getByRole("button", { name: "Start Conversation" }));
  await waitFor(() => expect(mocks.start).toHaveBeenCalledTimes(1));
}

describe("Vapi voice lifecycle", () => {
  it("never starts a call automatically or when opening the popup", () => {
    render(<VapiVoiceAssistant />);
    fireEvent.click(screen.getByRole("button", { name: "Talk to Saffan AI" }));
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("starts only the supplied existing assistant and prevents duplicate calls", async () => {
    await openAndStart();
    expect(mocks.start).toHaveBeenCalledWith("2dd590e3-2908-4d81-bd14-da07b424c62f");
    act(() => mocks.handlers.get("call-start")?.());
    expect(mocks.start).toHaveBeenCalledTimes(1);
  });

  it("ends the call and releases all registered event listeners", async () => {
    await openAndStart();
    fireEvent.click(screen.getByRole("button", { name: "End Conversation" }));
    await waitFor(() => expect(mocks.stop).toHaveBeenCalled());
    await waitFor(() => expect(mocks.handlers.size).toBe(0));
  });

  it("stops a call when the popup is closed", async () => {
    await openAndStart();
    fireEvent.click(screen.getByRole("button", { name: "Close voice assistant" }));
    await waitFor(() => expect(mocks.stop).toHaveBeenCalled());
  });

  it("cancels pending setup and cleans up any late connection", async () => {
    let finish: (value: unknown) => void = () => {};
    mocks.start.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    await openAndStart();
    fireEvent.click(screen.getByRole("button", { name: "End Conversation" }));
    expect(mocks.stop).toHaveBeenCalledTimes(1);
    await act(async () => { finish({ id: "late-call" }); });
    await waitFor(() => expect(mocks.stop).toHaveBeenCalledTimes(2));
    expect(mocks.handlers.size).toBe(0);
  });

  it("does not open a call without microphone support", async () => {
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
    render(<VapiVoiceAssistant />);
    fireEvent.click(screen.getByRole("button", { name: "Talk to Saffan AI" }));
    fireEvent.click(screen.getByRole("button", { name: "Start Conversation" }));
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("cleans up after a microphone or connection error", async () => {
    mocks.start.mockRejectedValue(new Error("Permission denied"));
    await openAndStart();
    await waitFor(() => expect(mocks.stop).toHaveBeenCalled());
    await waitFor(() => expect(mocks.handlers.size).toBe(0));
  });
});