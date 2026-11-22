import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "Tornado Academy — All-Access AI Platform & Community",
  description:
    "Master AI across Coding (Claude Code & Codex), Video Editing, Graphic Design, and Media Buying. Daily-updated AI library, free & paid tool stacks, and in-platform community. Launching December 1st.",
};

export default function EnglishHomePage() {
  return <LandingPage lang="en" />;
}
