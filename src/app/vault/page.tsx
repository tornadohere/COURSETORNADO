import type { Metadata } from "next";
import { VaultPage } from "@/components/VaultPage";

export const metadata: Metadata = {
  title: "خزنة تورنادو (Tornado Vault) — برومتات ومهارات AI مجانية",
  description:
    "مكتبة خزنة تورنادو المجانية: برومتات عملية مجرّبة ومهارات حقيقية من skills.sh في البرمجة بـ Claude Code & Codex، المونتاج، الجرافيك ديزاين، والـ Media Buying.",
};

export default function ArabicVaultPage() {
  return <VaultPage lang="ar" />;
}
