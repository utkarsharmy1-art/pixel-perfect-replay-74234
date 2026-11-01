import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2, Mic, PhoneOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type Vapi from "@vapi-ai/web";
import "./vapi-voice.css";

type Status = "ready" | "connecting" | "listening" | "speaking" | "ending" | "ended" | "error";
type Transcript = { role: "user" | "assistant"; text: string };
type Session = { sdk?: Vapi; cancelled: boolean; pending: boolean; dispose?: () => void };
const LABELS: Record<Status, string> = {
  ready: "AI Assistant is ready.", connecting: "Connecting...", listening: "Listening...",
  speaking: "Saffan AI is speaking...", ending: "Ending conversation...",
  ended: "Thank you for shopping with Saffan Collection!", error: "Conversation unavailable.",
};

export function VapiVoiceAssistant() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("ready");
  const [error, setError] = useState("");
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [partial, setPartial] = useState<Transcript | null>(null);
  const [locked, setLocked] = useState(false);
  const sessionRef = useRef<Session | null>(null);
  const mounted = useRef(true);
  const transcriptBox = useRef<HTMLDivElement>(null);

  const stop = async (session: Session) => {
    try { await session.sdk?.stop(); } catch { /* Best-effort transport cleanup. */ }
    if (!session.pending) {
      session.dispose?.();
      if (sessionRef.current === session) {
        sessionRef.current = null;
        if (mounted.current) setLocked(false);
      }
    }
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const session = sessionRef.current;
      if (session) { session.cancelled = true; void stop(session); }
    };
  }, []);

  useEffect(() => {
    const box = transcriptBox.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [transcripts, partial, open]);

  const end = () => {
    const session = sessionRef.current;
    if (session) { session.cancelled = true; void stop(session); }
    setPartial(null);
    setStatus("ended");
  };

  const start = async () => {
    if (sessionRef.current) return;
    const publicKey = import.meta.env['VITE_VAPI_PUBLIC_KEY'];
    const assistantId = import.meta.env['VITE_VAPI_ASSISTANT_ID'];
    if (!publicKey || !assistantId) {
      setError("Voice assistance is not configured yet. Please use the style assistant.");
      setStatus("error"); return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("A microphone and a secure browser connection are required for voice assistance.");
      setStatus("error"); return;
    }
    const session: Session = { cancelled: false, pending: true };
    sessionRef.current = session;
    setLocked(true); setStatus("connecting"); setError(""); setTranscripts([]); setPartial(null);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const current = () => mounted.current && !session.cancelled && sessionRef.current === session;
    const fail = (message: string) => {
      if (!current()) return;
      setError(message); setStatus("error"); setPartial(null);
      session.cancelled = true;
      void stop(session);
    };
    try {
      const { default: VapiSDK } = await import("@vapi-ai/web");
      if (!current()) return;
      const sdk = new VapiSDK(publicKey);
      session.sdk = sdk;
      const onStart = () => {
        if (!current()) { void stop(session); return; }
        clearTimeout(timer); setStatus("listening");
      };
      const onEnd = () => {
        if (current()) { setStatus("ended"); setPartial(null); }
        session.cancelled = true; void stop(session);
      };
      const onSpeechStart = () => { if (current()) setStatus("speaking"); };
      const onSpeechEnd = () => { if (current()) setStatus("listening"); };
      const onMessage = (message: unknown) => {
        if (!current() || !message || typeof message !== "object") return;
        const m = message as Record<string, unknown>;
        if (m['type'] !== "transcript" || typeof m['transcript'] !== "string" ||
          (m['role'] !== "user" && m['role'] !== "assistant")) return;
        const line: Transcript = { role: m['role'], text: m['transcript'] };
        if (m['transcriptType'] === "final") {
          setTranscripts((previous) => [...previous, line]); setPartial(null);
        } else if (m['transcriptType'] === "partial") setPartial(line);
      };
      const onError = () => fail("Unable to connect. Check your microphone permission and internet connection, then try again.");
      sdk.on("call-start", onStart); sdk.on("call-end", onEnd);
      sdk.on("speech-start", onSpeechStart); sdk.on("speech-end", onSpeechEnd);
      sdk.on("message", onMessage); sdk.on("error", onError);
      session.dispose = () => {
        clearTimeout(timer);
        sdk.removeListener("call-start", onStart); sdk.removeListener("call-end", onEnd);
        sdk.removeListener("speech-start", onSpeechStart); sdk.removeListener("speech-end", onSpeechEnd);
        sdk.removeListener("message", onMessage); sdk.removeListener("error", onError);
      };
      timer = setTimeout(() => fail("The connection took too long. Check microphone permission and try again."), 45000);
      // The SDK requests microphone permission and owns the microphone tracks.
      const call = await sdk.start(assistantId);
      if (!call && current()) onError();
    } catch {
      fail("Could not start the conversation. Allow microphone access and check your connection, then try again.");
    } finally {
      session.pending = false;
      if (session.cancelled) await stop(session);
    }
  };

  const active = status === "connecting" || status === "listening" || status === "speaking";
  const changeOpen = (next: boolean) => {
    if (!next && sessionRef.current) end();
    setOpen(next);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={changeOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button className="saffan-voice-launcher bg-ink text-ivory border border-gold/50 shadow-xl hover:bg-ink hover:text-gold">
          <span className="saffan-voice-icon saffan-voice-pulse bg-gold text-ink"><Mic strokeWidth={1.5} /></span>
          <span className="text-xs">Talk to Saffan AI</span>
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-ink/40" />
        <DialogPrimitive.Content className="saffan-voice-panel border bg-background text-foreground shadow-xl outline-none">
          <header className="flex items-center gap-3 bg-ink text-ivory p-5">
            <Mic className="h-6 w-6 shrink-0 text-gold" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="font-display text-2xl">SAFFAN AI</DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-xs text-ivory/70">Your Personal Shopping Assistant</DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild><Button variant="ghost" size="icon" aria-label="Close voice assistant" className="shrink-0"><X /></Button></DialogPrimitive.Close>
          </header>
          <div className="p-5 border-b">
            <p className="font-display text-xl leading-snug">Hello! Welcome to Saffan Collection. How can I help you today?</p>
            <div role="status" className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              {status === "connecting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className={`h-4 w-4 ${active ? "saffan-voice-pulse text-gold" : ""}`} />}
              <span>{LABELS[status]}</span>
            </div>
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
          </div>
          {(transcripts.length > 0 || partial) && (
            <div ref={transcriptBox} className="saffan-voice-transcripts p-5 space-y-4" role="log" aria-label="Live conversation" aria-live="polite">
              {[...transcripts, ...(partial ? [partial] : [])].map((line, i) => (
                <div key={i} className="text-sm break-words"><p className="mb-1 text-xs text-muted-foreground">{line.role === "user" ? "You" : "Saffan AI"}</p><p>{line.text}</p></div>
              ))}
            </div>
          )}
          <div className="p-5 mt-auto">
            {active ? <Button onClick={end} variant="outline" className="w-full h-11"><PhoneOff />End Conversation</Button> :
              <Button onClick={() => void start()} disabled={locked} className="w-full h-11"><Mic />{locked ? "Ending conversation..." : "Start Conversation"}</Button>}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}