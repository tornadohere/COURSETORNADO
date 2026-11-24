import { LandingPage } from "@/components/LandingPage";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata({
  title: "Tornado Academy — All-Access AI Platform & Community",
  description:
    "Master AI across Coding (Claude Code & Codex), Video Editing, Graphic Design, and Media Buying. Daily-updated AI library, free & paid tool stacks, and in-platform community. Launching December 1st.",
  path: "/en",
  ogImage: "/og/og-en.jpg",
  locale: "en_US",
});

export default function EnglishHomePage() {
  return <LandingPage lang="en" />;
}
