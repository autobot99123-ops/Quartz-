"use client";

import { useEffect, useRef } from "react";
import { Compartment, EditorState } from "@codemirror/state";
import {
  EditorView,
  highlightActiveLine,
  lineNumbers,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { keymap } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { Play } from "lucide-react";
import { TWO_SUM_STARTER_CODE } from "@/lib/judge/problems";

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  onCodeChange?: (code: string) => void;
  onRun?: () => void;
  readOnly?: boolean;
}

export function CodeEditor({
  initialCode = TWO_SUM_STARTER_CODE,
  language = "javascript",
  onCodeChange,
  onRun,
  readOnly = false,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const editableCompartment = useRef(new Compartment());
  const onCodeChangeRef = useRef(onCodeChange);

  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const state = EditorState.create({
      doc: initialCode,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        language === "python" ? python() : javascript(),
        oneDark,
        EditorView.lineWrapping,
        EditorView.theme({
          "&": { height: "100%", fontSize: "14px" },
          ".cm-scroller": { overflow: "auto" },
          ".cm-content": { fontFamily: "'Fira Code', 'Cascadia Code', monospace" },
        }),
        editableCompartment.current.of(EditorView.editable.of(!readOnly)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onCodeChangeRef.current?.(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: container });
    viewRef.current = view;
    onCodeChangeRef.current?.(initialCode);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Mount once — code/readOnly sync via effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: editableCompartment.current.reconfigure(
        EditorView.editable.of(!readOnly),
      ),
    });
  }, [readOnly]);

  const fileName =
    language === "typescript"
      ? "solution.ts"
      : language === "python"
        ? "solution.py"
        : "solution.js";

  return (
    <div
      className="codemirror-container h-[500px] md:h-[600px] rounded-xl overflow-hidden"
      style={{ background: "#1e1e2e" }}
    >
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ background: "#181825", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span
            className="text-xs ml-2"
            style={{ color: "var(--fg)", opacity: 0.4 }}
          >
            {fileName}
          </span>
        </div>
        <button
          onClick={onRun}
          disabled={readOnly}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          <Play className="w-4 h-4" /> Run
        </button>
      </div>
      <div ref={containerRef} className="h-[calc(100%-42px)] text-left" />
    </div>
  );
}
