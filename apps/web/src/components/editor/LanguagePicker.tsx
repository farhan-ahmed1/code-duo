"use client";

import { SUPPORTED_LANGUAGES } from "@code-duo/shared";
import type { EditorLanguage } from "@code-duo/shared";
import { Code2 } from "lucide-react";

const LANGUAGE_LABELS: Record<EditorLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  go: "Go",
  rust: "Rust",
  c: "C",
  cpp: "C++",
  java: "Java",
  csharp: "C#",
  ruby: "Ruby",
  php: "PHP",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  markdown: "Markdown",
};

interface LanguagePickerProps {
  language: EditorLanguage;
  onLanguageChange: (lang: EditorLanguage) => void;
}

export default function LanguagePicker({
  language,
  onLanguageChange,
}: LanguagePickerProps) {
  return (
    <label className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-surface-muted px-2.5 py-1.5 text-xs text-muted-foreground shadow-sm">
      <Code2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">Editor language</span>
      <select
        aria-label="Editor language"
        value={language}
        onChange={(e) => onLanguageChange(e.target.value as EditorLanguage)}
        className="min-w-0 bg-transparent pr-5 text-xs font-medium text-foreground outline-none"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {LANGUAGE_LABELS[lang]}
          </option>
        ))}
      </select>
    </label>
  );
}