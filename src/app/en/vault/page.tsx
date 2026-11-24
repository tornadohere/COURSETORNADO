import { VaultPage } from "@/components/VaultPage";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata({
  title: "Tornado Vault — Free AI Prompts & Agent Skills Library",
  description:
    "Free production prompts and downloadable SKILL.md files across AI Coding (Claude Code & Codex), Video Editing, Graphic Design, and Media Buying.",
  path: "/en/vault",
  ogImage: "/og/og-vault.jpg",
  locale: "en_US",
});

export default function EnglishVaultPage() {
  return <VaultPage lang="en" />;
}
