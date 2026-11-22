import type { Metadata } from "next";
import { VaultPage } from "@/components/VaultPage";

export const metadata: Metadata = {
  title: "Tornado Vault — Free AI Prompts & Agent Skills Library",
  description:
    "Free production prompts and downloadable SKILL.md files across AI Coding (Claude Code & Codex), Video Editing, Graphic Design, and Media Buying.",
};

export default function EnglishVaultPage() {
  return <VaultPage lang="en" />;
}
