import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { RawChatData, Message, ExportOptions, ExportState } from "../utils/types";
import { parseConversation } from "../utils/parse";
import { toMarkdown } from "../utils/markdown";
import { generateFilename } from "../utils/filename";

const DEFAULT_OPTIONS: ExportOptions = {
  includeUser: true,
  includeAssistant: true,
  includeSystem: false,
  includeMetadata: false,
  separator: "---",
  filenameTemplate: "{title}",
};

/* ───────────────────────────────────────────
   Sub-components
   ─────────────────────────────────────────── */

function FilenameInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
        Filename
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                   transition-colors bg-gray-50 hover:bg-white"
        spellCheck={false}
      />
    </div>
  );
}

function ContentSelector({
  options,
  onChange,
}: {
  options: ExportOptions;
  onChange: (o: ExportOptions) => void;
}) {
  const toggle = (key: keyof ExportOptions) => {
    onChange({ ...options, [key]: !options[key] });
  };

  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
        Content
      </label>
      <div className="flex gap-2">
        {[
          { key: "includeUser" as const, label: "User", short: "U" },
          { key: "includeAssistant" as const, label: "Assistant", short: "A" },
          { key: "includeSystem" as const, label: "System", short: "S" },
        ].map(({ key, label, short }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all
              ${
                options[key]
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
              }`}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{short}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AdvancedPanel({
  options,
  onChange,
  open,
  onToggle,
}: {
  options: ExportOptions;
  onChange: (o: ExportOptions) => void;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium
                   text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <span className="uppercase tracking-wider">Advanced</span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-100">
          {/* Filename template */}
          <div className="space-y-1 pt-3">
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Filename Template
            </label>
            <input
              type="text"
              value={options.filenameTemplate}
              onChange={(e) =>
                onChange({ ...options, filenameTemplate: e.target.value })
              }
              className="w-full px-2.5 py-1.5 text-xs font-mono border border-gray-200 rounded-md
                         focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                         bg-gray-50"
              spellCheck={false}
            />
            <p className="text-[10px] text-gray-400">
              {"{title}"}, {"{date}"}, {"{time}"}
            </p>
          </div>

          {/* Separator */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Message Separator
            </label>
            <select
              value={options.separator}
              onChange={(e) => onChange({ ...options, separator: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md
                         focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                         bg-gray-50 cursor-pointer"
            >
              <option value="---">--- (horizontal rule)</option>
              <option value="***">*** (asterisks)</option>
              <option value="">(blank line)</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Options
            </label>
            {[
              {
                key: "includeMetadata" as const,
                label: "Include metadata header (date, count)",
              },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={() => onChange({ ...options, [key]: !options[key] })}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600
                             focus:ring-blue-100 cursor-pointer"
                />
                <span className="text-xs text-gray-600">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Preview({
  messages,
  options,
}: {
  messages: Message[];
  options: ExportOptions;
}) {
  const filtered = useMemo(() => {
    if (!messages.length) return [];
    return messages.filter((m) => {
      switch (m.role) {
        case "user":
          return options.includeUser;
        case "assistant":
          return options.includeAssistant;
        case "system":
          return options.includeSystem;
        default:
          return true;
      }
    });
  }, [messages, options.includeUser, options.includeAssistant, options.includeSystem]);

  if (!filtered.length) {
    return (
      <div className="py-3 text-center text-xs text-gray-400">
        No messages match selected content filters
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
        Preview
        <span className="ml-1 text-gray-300 font-normal normal-case">
          ({filtered.length} msgs)
        </span>
      </label>
      <div className="max-h-[180px] overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
        {filtered.slice(0, 30).map((m) => (
          <div key={m.id} className="px-3 py-2 flex items-start gap-2">
            <span
              className={`inline-flex shrink-0 w-5 h-5 items-center justify-center rounded text-[9px] font-bold uppercase
                ${
                  m.role === "user"
                    ? "bg-blue-50 text-blue-600"
                    : m.role === "assistant"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                }`}
            >
              {m.role[0]}
            </span>
            <span className="text-xs text-gray-600 leading-5 truncate">
              {m.content.slice(0, 80)}
              {m.content.length > 80 ? "…" : ""}
            </span>
          </div>
        ))}
        {filtered.length > 30 && (
          <div className="px-3 py-2 text-center text-[10px] text-gray-400">
            +{filtered.length - 30} more messages
          </div>
        )}
      </div>
    </div>
  );
}

function ExportButton({
  state,
  errorMessage,
  onClick,
}: {
  state: ExportState;
  errorMessage: string;
  onClick: () => void;
}) {
  const label = {
    idle: "Export",
    loading: "Exporting…",
    success: "Exported",
    error: "Retry",
  }[state];

  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={state === "loading"}
        className={`w-full py-2.5 text-sm font-semibold rounded-lg transition-all
          ${
            state === "idle"
              ? "bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.99]"
              : state === "loading"
                ? "bg-gray-300 text-gray-500 cursor-wait"
                : state === "success"
                  ? "bg-emerald-500 text-white"
                  : "bg-red-500 text-white hover:bg-red-600"
          }`}
      >
        {state === "success" && (
          <svg
            className="inline w-4 h-4 mr-1.5 -mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {label}
      </button>

      {state === "error" && errorMessage && (
        <p className="text-xs text-red-500 text-center">{errorMessage}</p>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────
   Skeleton / Empty states
   ─────────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-1/3" />
      <div className="h-9 bg-gray-100 rounded" />
      <div className="h-8 bg-gray-100 rounded" />
      <div className="h-24 bg-gray-100 rounded" />
      <div className="h-10 bg-gray-100 rounded" />
    </div>
  );
}

function NotOnChatGPT() {
  return (
    <div className="p-6 text-center">
      <p className="text-sm text-gray-500 mb-2">Not on a ChatGPT page</p>
      <p className="text-xs text-gray-400">
        Open a conversation at{" "}
        <span className="font-mono text-gray-500">chatgpt.com</span> to export
      </p>
    </div>
  );
}

function ErrorLoadingData({ message }: { message: string }) {
  return (
    <div className="p-6 text-center">
      <p className="text-sm text-gray-500 mb-2">Could not load conversation</p>
      <p className="text-xs text-red-400 mb-3">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
      >
        Reload popup
      </button>
    </div>
  );
}

/* ───────────────────────────────────────────
   Main App
   ─────────────────────────────────────────── */

export default function App() {
  const [chatData, setChatData] = useState<RawChatData | null>(null);
  const [dataState, setDataState] = useState<"loading" | "ready" | "error" | "not-chatgpt">(
    "loading",
  );
  const [dataError, setDataError] = useState("");
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_OPTIONS);
  const [exportState, setExportState] = useState<ExportState>("idle");
  const [exportError, setExportError] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [filenameOverride, setFilenameOverride] = useState<string | null>(null);

  /* ── Fetch conversation data on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id || !tab?.url?.startsWith("https://chatgpt.com")) {
          setDataState("not-chatgpt");
          return;
        }

        const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_CHAT_DATA" });
        if (response?.ok && response.data) {
          setChatData(response.data);
          setDataState("ready");
        } else {
          setDataError(response?.error || "No conversation data");
          setDataState("error");
        }
      } catch (err: any) {
        setDataError(err.message || "Connection failed");
        setDataState("error");
      }
    })();
  }, []);

  /* ── Derive messages ── */
  const messages = useMemo(() => (chatData ? parseConversation(chatData) : []), [chatData]);

  /* ── Derive filename ── */
  const firstUserMessage = useMemo(
    () => messages.find((m) => m.role === "user")?.content,
    [messages],
  );

  const derivedFilename = useMemo(
    () => generateFilename(chatData?.title, firstUserMessage, options.filenameTemplate),
    [chatData?.title, firstUserMessage, options.filenameTemplate],
  );

  const filename = filenameOverride ?? derivedFilename;

  /* ── Export handler ── */
  const handleExport = useCallback(async () => {
    if (!messages.length) return;
    setExportState("loading");
    setExportError("");

    try {
      const md = toMarkdown(chatData?.title || "ChatGPT", messages, options);
      const dataUrl = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);

      await new Promise<void>((resolve, reject) => {
        chrome.downloads.download(
          { url: dataUrl, filename, saveAs: false },
          (_downloadId: number) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          },
        );
      });

      setExportState("success");
      setTimeout(() => window.close(), 1200);
    } catch (err: any) {
      setExportState("error");
      setExportError(err.message || "Export failed");
    }
  }, [filename, messages, options, chatData]);

  /* ── Reset to defaults ── */
  const resetToDefaults = useCallback(() => {
    setOptions(DEFAULT_OPTIONS);
    setFilenameOverride(null);
    setAdvancedOpen(false);
  }, []);

  /* ── Keep ref for keyboard shortcut (avoids stale closure) ── */
  const handleExportRef = useRef(handleExport);
  handleExportRef.current = handleExport;

  /* ── Render logic ── */
  if (dataState === "loading") return <LoadingSkeleton />;
  if (dataState === "not-chatgpt") return <NotOnChatGPT />;
  if (dataState === "error") return <ErrorLoadingData message={dataError} />;

  return (
    <div className="flex flex-col" onKeyDown={(e) => {
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA") return;
        if (exportState !== "idle") return;
        e.preventDefault();
        handleExportRef.current();
      }
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="text-sm font-semibold text-gray-900">Export Chat</h1>
        <button
          onClick={resetToDefaults}
          className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors
                     px-2 py-0.5 rounded hover:bg-gray-100"
        >
          Reset
        </button>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Filename */}
        <FilenameInput value={filename} onChange={setFilenameOverride} />

        {/* Content selector */}
        <ContentSelector options={options} onChange={setOptions} />

        {/* Advanced */}
        <AdvancedPanel
          options={options}
          onChange={setOptions}
          open={advancedOpen}
          onToggle={() => setAdvancedOpen(!advancedOpen)}
        />

        {/* Preview */}
        <Preview messages={messages} options={options} />

        {/* Export */}
        <ExportButton
          state={exportState}
          errorMessage={exportError}
          onClick={handleExport}
        />
      </div>
    </div>
  );
}
