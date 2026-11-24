import { VaultPage } from "@/components/VaultPage";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata({
  title: "خزنة تورنادو (Tornado Vault) — برومتات ومهارات AI مجانية",
  description:
    "مكتبة خزنة تورنادو المجانية: برومتات عملية مجرّبة ومهارات حقيقية من skills.sh في البرمجة بـ Claude Code & Codex، المونتاج، الجرافيك ديزاين، والـ Media Buying.",
  path: "/vault",
  ogImage: "/og/og-vault.jpg",
  locale: "ar_EG",
});

export default function ArabicVaultPage() {
  return <VaultPage lang="ar" />;
}
