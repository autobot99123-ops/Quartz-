"use client";

import { useRef, useCallback } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import { Settings2, Play } from "lucide-react";

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  onCodeChange?: (code: string) => void;
  onRun?: () => void;
  readOnly?: boolean;
}

const defaultCode = `// Welcome to Quartz Judge!
// Write your solution below and hit Run.

function solution(nums: number[], target: number): number[] {
    // Your code here
    for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] === target) {
                return [i, j];
            }
        }
    }
    return [];
}

// Test it:
console.log(solution([2, 7, 11, 15], 9)); // Expected: [0, 1]
`;

export function CodeEditor({
  initialCode = defaultCode,
  language = "typescript",
  onCodeChange,
  onRun,
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const handleChange: OnChange = (value) => {
    onCodeChange?.(value || "");
  };

  return (
    <div className="monaco-container h-[500px] md:h-[600px] bg-[#1e1e2e] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[#181825] border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-xs text-gray-400 ml-2">solution.ts</span>
        </div>
        <button
          onClick={onRun}
          disabled={readOnly}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          <Play className="w-4 h-4" /> Run
        </button>
      </div>
      <Editor
        height="calc(100% - 42px)"
        language={language}
        value={initialCode}
        onChange={handleChange}
        onMount={handleMount}
        theme="vs-dark"
        readOnly={readOnly}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', monospace",
          lineNumbers: "on",
          padding: { top: 16 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          formatOnPaste: true,
          suggestOnTriggerCharacters: true,
        }}
      />
    </div>
  );
}
