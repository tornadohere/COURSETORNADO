export type VaultCategory = "coding" | "video" | "design" | "marketing";
export type VaultItemType = "prompt" | "skill";

export interface VaultItem {
  id: string;
  num: string;
  type: VaultItemType;
  category: VaultCategory;
  featured?: boolean;
  fileName: string;
  installCmd?: string;
  sourceLabel?: string;
  tagAr: string;
  tagEn: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  howToAr: string;
  howToEn: string;
  compatAr: string;
  compatEn: string;
  content: string;
}

export const TORNADO_SIGNATURE_BUNDLE = {
  badgeAr: "حزمة تورنادو المميزة · للمشتركين في المجتمع فقط",
  badgeEn: "TORNADO SIGNATURE BUNDLE · COMMUNITY MEMBERS ONLY",
  titleAr: "حزمة تورنادو المميزة",
  titleEn: "Tornado Signature Bundle",
  subtitleAr:
    "الأدوات والمهارات القوية اللي أنا بستخدمها دايمًا في كل فيديوهاتي — مخصّصة فقط للمشتركين في مجتمع Tornado Academy.",
  subtitleEn:
    "The exact high-leverage skills, workflows, and production prompts I personally use in every single video — reserved exclusively for Tornado Community members.",
  highlightsAr: [
    "حزمة الـ Skills الخاصة بالبرمجة السريعة وإخراج المواقع بمستوى استوديو (نفس اللي بتشوفها في فيديوهاتي).",
    "قوالب المونتاج السينمائي، هندسة الصوت، وأنظمة بناء الهوية البصرية والحملات البيّاعة.",
    "تحديث مستمر مع كل فيديو جديد وكل موديل AI ينزل + دعم مباشر داخل المجتمع.",
  ],
  highlightsEn: [
    "My personal Claude Code & Codex production Skills for shipping studio-grade apps fast.",
    "Full video editing choreography, sound architecture, brand visual systems, and ad-testing workflows.",
    "Continuously updated with every new video and AI model drop, plus direct community support.",
  ],
  ctaAr: "اشترك في المجتمع واحصل على الحزمة — 1500 ج.م",
  ctaEn: "Join Community to Unlock Bundle · 1,500 EGP",
  noteAr: "الافتتاح 1 ديسمبر · دفع مرة واحدة + ضمان استرداد كامل في أول 3 أيام",
  noteEn: "Opens Dec 1 · One-time payment + 3-day 100% money-back guarantee",
};

export const VAULT_ITEMS: VaultItem[] = [
  /* ===================== 1. CODING (PROMPTS + SKILLS) ===================== */
  {
    id: "coding-prompt-spec",
    num: "01",
    type: "prompt",
    category: "coding",
    featured: true,
    fileName: "fullstack-architect.prompt",
    tagAr: "برومت · Claude Code & Codex",
    tagEn: "Prompt · Claude Code & Codex",
    titleAr: "برومت بناء ميزة أو موقع كامل بدون أخطاء من أول مرة",
    titleEn: "Zero-Guesswork Feature & Page Builder Prompt",
    descAr:
      "بدل ما الـ AI يكتب كود ناقص أو يبوظ التصميم، البرومت ده بيجبره يقرأ ملفات مشروعك الأول، يخطط، وبعدين يبني التصميم متجاوب على الديسكتوب والموبايل.",
    descEn:
      "Stops AI coding agents from hallucinating—forces codebase inspection first, clean responsive layout, and build verification before finishing.",
    howToAr:
      "انسخ البرومت، بدّل الجزء بين القوسين [...] بوصف الصفحة أو الميزة اللي عاوزها، وابعته في Claude Code أو Codex أو Cursor.",
    howToEn:
      "Copy the prompt, replace [DESCRIBE YOUR FEATURE] with what you want to build, and send it to Claude Code, Codex, or Cursor.",
    compatAr: "Claude Code · Codex · Gemini CLI · Cursor",
    compatEn: "Claude Code · Codex · Gemini CLI · Cursor",
    content: `You are a Principal Full-Stack Engineer & Product Designer.

GOAL: Build [DESCRIBE YOUR FEATURE OR PAGE IN 2 SENTENCES].

STRICT EXECUTION PROTOCOL:
1. INSPECT FIRST: Read existing layout, CSS tokens, fonts, and component conventions before writing any code. Reuse existing utilities and design patterns.
2. DESIGN DISCIPLINE: Match the exact color palette, spacing, and typography of the project. Support both Desktop (1440px) and Mobile (390px) with zero horizontal overflow.
3. CLEAN CODE: Keep functions small, avoid duplicated logic, handle loading/empty/error states, and use zero placeholder comments like "// TODO".
4. VERIFY BEFORE REPLYING: Run type-check (tsc --noEmit) and production build, and fix every error you find before reporting done.`,
  },
  {
    id: "coding-prompt-debug",
    num: "02",
    type: "prompt",
    category: "coding",
    fileName: "root-cause-fixer.prompt",
    tagAr: "برومت · إصلاح الأخطاء",
    tagEn: "Prompt · Root-Cause Debugging",
    titleAr: "برومت تشخيص وإصلاح أي Bug معقّد بدون ما يبوظ باقي الكود",
    titleEn: "Surgical Root-Cause Bug Hunter Prompt",
    descAr:
      "أقوى برومت لما تقابلك مشكلة غريبة في الكود: يمنع الـ AI من التخمين العشوائي ويخليه يتتبع السبب الجذري ويصلحه بأصغر تعديل ممكن.",
    descEn:
      "Prevents blind trial-and-error edits—forces a trace from trigger to state to DOM and applies the minimal surgical fix.",
    howToAr:
      "انسخ البرومت وحط رسالة الخطأ أو وصف المشكلة مكان [PASTE ERROR OR BUG] مع اسم الملف.",
    howToEn:
      "Copy the prompt, paste your error log or bug symptom inside [PASTE ERROR OR BUG], and run it inside your coding agent.",
    compatAr: "يشتغل على النسخ المجانية والمدفوعة",
    compatEn: "Works on free and paid AI coding tools",
    content: `TASK: Surgical Root-Cause Diagnosis & Minimal Fix
BUG / ERROR: [PASTE ERROR OR BUG DESCRIPTION]

RULES:
1. Trace the exact execution path (Trigger -> Handler -> State/API -> UI Render).
2. State the single root cause in 2 sentences and cite the exact file and line numbers.
3. Apply the smallest possible drop-in fix without refactoring unrelated code.
4. Re-run lint/type-check/build to prove the fix works and nothing else broke.`,
  },
  {
    id: "coding-skill-react",
    num: "01",
    type: "skill",
    category: "coding",
    featured: true,
    fileName: "react-best-practices/SKILL.md",
    installCmd: "npx skills add vercel-labs/agent-skills --skill react-best-practices",
    sourceLabel: "skills.sh · vercel-labs/agent-skills",
    tagAr: "مهارة حقيقية (skills.sh) · React & Next.js",
    tagEn: "Official Skill (skills.sh) · React & Next.js",
    titleAr: "مهارة Vercel الرسمية لأداء React و Next.js الاحترافي",
    titleEn: "Vercel React & Next.js Best Practices Skill",
    descAr:
      "أشهر مهارة برمجة على موقع skills.sh (من فريق Vercel): بتدي الـ Coding Agent أكتر من 70 قاعدة لمنع بطء التحميل، تقليل حجم الباندل، وترتيب الـ Server Components.",
    descEn:
      "The #1 React & Next.js skill on skills.sh by Vercel engineering—eliminates request waterfalls, shrinks client bundles, and optimizes rendering.",
    howToAr:
      "شغّل أمر التثبيت في تيرمنال مشروعك (أو انسخ المحتوى في ملف SKILL.md) وهيشتغل تلقائيًا مع Claude Code وCodex.",
    howToEn:
      "Run the npx skills add command in your project terminal (or drop SKILL.md into your agent skills folder).",
    compatAr: "مثبّتة عبر skills.sh · Claude Code · Codex · Cursor",
    compatEn: "Registry: skills.sh · Claude Code · Codex · Cursor",
    content: `---
name: react-best-practices
source: skills.sh (vercel-labs/agent-skills)
description: Performance optimization guidelines for React and Next.js applications.
---

# Install Command
npx skills add vercel-labs/agent-skills --skill react-best-practices

# Core Rules Applied Automatically
1. Eliminate Waterfalls: Start independent async fetches in parallel with Promise.all() and wrap slow branches in <Suspense>.
2. Bundle Size Discipline: Avoid barrel-file imports for large icon/UI packs; dynamically import heavy client-only widgets with next/dynamic.
3. Server-First Rendering: Keep data fetching and secrets in Server Components; mark "use client" only on interactive leaves.
4. Re-Render Control: Derive state during render instead of redundant useEffect + setState chains.`,
  },
  {
    id: "coding-skill-frontend",
    num: "02",
    type: "skill",
    category: "coding",
    fileName: "frontend-design/SKILL.md",
    installCmd: "npx skills add anthropics/skills@frontend-design",
    sourceLabel: "skills.sh · anthropics/skills",
    tagAr: "مهارة حقيقية (skills.sh) · Frontend UI",
    tagEn: "Official Skill (skills.sh) · Frontend UI",
    titleAr: "مهارة Anthropic لبناء واجهات مواقع مبهرة بعيدًا عن التصميم المكرر",
    titleEn: "Anthropic Frontend Design Skill",
    descAr:
      "المهارة الرسمية من Anthropic على skills.sh اللي بتمنع الخطوط والألوان المكررة وتجبر الـ AI يصمّم واجهات حقيقية بتناسق بصري عالي.",
    descEn:
      "Official Anthropic skill from skills.sh that bans generic AI aesthetics and enforces bold typography, spatial rhythm, and cohesive palettes.",
    howToAr:
      "ثبّتها بأمر npx skills add أو انسخها في مجلد المهارات قبل ما تطلب من الـ AI تصميم أي صفحة هبوط.",
    howToEn:
      "Install via npx skills add or copy into your skills folder before asking your agent to design any UI.",
    compatAr: "مثبّتة عبر skills.sh · Claude Code · Codex · Antigravity",
    compatEn: "Registry: skills.sh · Claude Code · Codex · Antigravity",
    content: `---
name: frontend-design
source: skills.sh (anthropics/skills)
description: Create distinctive, production-grade frontend interfaces with high design quality.
---

# Install Command
npx skills add anthropics/skills@frontend-design

# Design Principles Enforced
1. Intentional Aesthetic Direction: Choose a clear visual tone (editorial, brutalist, luxury dark, tactile glass) and commit to it consistently.
2. Typography & Hierarchy: Pair expressive display fonts with clean body fonts; never default to generic Inter/Roboto stacks.
3. Color Restraint: One dominant surface, one ink tone, and one sharp accent—never loud multi-color rainbow gradients.
4. Motion with Purpose: Focus on high-impact hero reveals and smooth scroll choreography rather than noisy micro-animations everywhere.`,
  },

  /* ===================== 2. VIDEO (PROMPTS + SKILLS) ===================== */
  {
    id: "video-prompt-hook",
    num: "01",
    type: "prompt",
    category: "video",
    featured: true,
    fileName: "viral-reel-director.prompt",
    tagAr: "برومت · مونتاج وفيديو",
    tagEn: "Prompt · Video & Reels Direction",
    titleAr: "برومت تحويل أي فكرة لسكريبت ريلز + خطة مونتاج ثانية بثانية",
    titleEn: "Viral Reel Script + Beat-by-Beat Edit Plan Prompt",
    descAr:
      "بيديك 3 هوكات قوية لأول 3 ثواني، وبعدين يكتب السكريبت باللهجة المصرية/العربية الطبيعية، ومعاه جدول مونتاج كامل (اللقطة + النص على الشاشة + المؤثر الصوتي).",
    descEn:
      "Generates 3 thumb-stopping 3-second hooks, natural spoken script, and a full timestamped edit sheet (visuals, on-screen text, and SFX).",
    howToAr:
      "انسخ البرومت، اكتب موضوع الفيديو والجمهور المستهدف مكان الأقواس [...]، وابعته لـ ChatGPT أو Claude أو Gemini.",
    howToEn:
      "Copy, fill in [VIDEO TOPIC] and [TARGET AUDIENCE], and run it in ChatGPT, Claude, or Gemini.",
    compatAr: "ChatGPT · Claude · Gemini · CapCut",
    compatEn: "ChatGPT · Claude · Gemini · CapCut",
    content: `ACT AS: Senior Short-Form Video Director & Retention Editor (9:16 Reels / TikTok / Shorts).

TOPIC: [VIDEO TOPIC]
TARGET AUDIENCE: [TARGET AUDIENCE]
LANGUAGE: Natural spoken Egyptian Arabic (clear, punchy, zero robotic phrasing).

DELIVER THIS EXACT STRUCTURE:
1. THREE 3-SECOND HOOKS:
   - Hook A (Curiosity / Bold Claim)
   - Hook B (Pain-Point / Myth-Buster)
   - Hook C (Visual Proof / Result-First)
2. 45-SECOND SPOKEN SCRIPT: Short punchy sentences, max 12 words per breath.
3. BEAT-BY-BEAT EDITING TABLE (every 2.5 to 3 seconds):
   | Timestamp | Spoken Line | Visual / B-Roll / Motion Card | On-Screen Text (max 3 words) | Sound Effect (SFX) |
4. AI B-ROLL PROMPTS: Write 3 ready-to-paste prompts for Runway / Kling / Free AI video tools matching the script.`,
  },
  {
    id: "video-prompt-cinematic",
    num: "02",
    type: "prompt",
    category: "video",
    fileName: "cinematic-broll-engine.prompt",
    tagAr: "برومت · توليد مشاهد الفيديو",
    tagEn: "Prompt · AI Video Generation",
    titleAr: "برومت توليد مشاهد فيديو سينمائية واقعية (بدون شكل البلاستيك)",
    titleEn: "Photorealistic AI Video Shot Generator Prompt",
    descAr:
      "بدل الفيديوهات اللي بتطلع مشوهة، البرومت ده بيكتب لك 4 مشاهد جاهزة بمواصفات عدسة حقيقية، حركة كاميرا بطيئة متزنة، وإضاءة استوديو.",
    descEn:
      "Turns any simple scene idea into 4 physically grounded camera-locked prompts for Runway, Kling, Veo, or open-source video models.",
    howToAr:
      "حط فكرة المشهد اللي محتاجه مكان [DESCRIBE SCENE]، وبعدين انسخ النتيجة اللي هتطلعلك وحطها في Runway أو Kling أو أداة الفيديو المجانية.",
    howToEn:
      "Replace [DESCRIBE SCENE] with your scene idea, run in any LLM, then paste the generated shot prompt into Runway, Kling, or Wan.",
    compatAr: "Runway Gen-3 · Kling · Google Veo · Wan Open-Source",
    compatEn: "Runway Gen-3 · Kling · Google Veo · Wan Open-Source",
    content: `You are a Cinematographer specializing in AI video prompting (Runway / Kling / Veo / Wan).
Convert this scene idea into 3 distinct, distortion-free video prompts:

SCENE IDEA: [DESCRIBE SCENE]

RULES FOR EVERY PROMPT:
- Camera: Specify exact slow movement (slow dolly-in, locked tripod, or gentle lateral slider) + 35mm/50mm lens + f/2.0 depth of field.
- Physics: Keep subject motion subtle and realistic (no fast chaotic limbs or morphing text).
- Lighting: Specify key light angle, rim light, and natural film texture (24fps).
- Output each prompt in clean English ready to copy-paste, plus 1 negative prompt line to block plastic skin and warping.`,
  },
  {
    id: "video-skill-remotion",
    num: "01",
    type: "skill",
    category: "video",
    featured: true,
    fileName: "remotion-best-practices/SKILL.md",
    installCmd: "npx skills add remotion-dev/skills",
    sourceLabel: "skills.sh · remotion-dev/skills",
    tagAr: "مهارة حقيقية (skills.sh) · Motion & Video Code",
    tagEn: "Official Skill (skills.sh) · Motion & Video",
    titleAr: "مهارة Remotion الرسمية لصناعة الموشن جرافيك والفيديوهات بالكود",
    titleEn: "Remotion Programmatic Video & Motion Graphics Skill",
    descAr:
      "المهارة الرسمية على skills.sh من فريق Remotion: بتخلي Claude Code وCodex يبنوا لك فيديوهات موشن جرافيك كاملة بـ React بدقة 60fps وحركة Apple Spring احترافية.",
    descEn:
      "Official skills.sh package from Remotion—teaches coding agents frame-accurate spring animations, typography timing, audio sync, and MP4 rendering.",
    howToAr:
      "ثبّتها في مشروع Remotion بأمر npx skills add remotion-dev/skills واطلب من الـ AI يبني لك مشهد موشن جرافيك كامل.",
    howToEn:
      "Install in your video project with npx skills add remotion-dev/skills and ask Claude Code to compose scenes.",
    compatAr: "مثبّتة عبر skills.sh · Remotion · Claude Code · Codex",
    compatEn: "Registry: skills.sh · Remotion · Claude Code · Codex",
    content: `---
name: remotion-best-practices
source: skills.sh (remotion-dev/skills)
description: Best practices for building programmatic motion graphics and videos with Remotion and React.
---

# Install Command
npx skills add remotion-dev/skills

# Core Motion Rules
1. Frame-Accurate Timing: Drive all motion from useCurrentFrame() and interpolate() / spring()—never CSS transitions.
2. Spring Physics: Use smooth critically-damped springs (damping: 18-24, stiffness: 140) for Apple-grade UI reveals.
3. Sequence Architecture: Break scenes into <Sequence from={...} durationInFrames={...}> blocks with clean audio <Audio> cues.
4. Safe Export: Preload fonts/media with delayRender() and verify 1080x1920 (9:16) or 1920x1080 (16:9) composition bounds.`,
  },
  {
    id: "video-skill-ffmpeg",
    num: "02",
    type: "skill",
    category: "video",
    fileName: "ffmpeg-smart-editor/SKILL.md",
    sourceLabel: "Tornado Production Workflow",
    tagAr: "مهارة (Skill) · أتمتة المونتاج وFFmpeg",
    tagEn: "Skill · Automated FFmpeg Editing",
    titleAr: "مهارة قص السكتات، تحسين الصوت، وتجهيز الريلز تلقائيًا بـ FFmpeg",
    titleEn: "FFmpeg Auto-Cut, Voice Leveling & Reel Export Skill",
    descAr:
      "مهارة بتخلي الـ AI يكتب وينفّذ أوامر FFmpeg نظيفة لقَص لحظات الصمت من الصوت، ضبط مستوى الصوت لـ -14 LUFS، وتصدير الفيديو جاهز للنشر.",
    descEn:
      "Guides your AI agent to generate exact FFmpeg pipelines for silence removal, broadcast loudness normalization (-14 LUFS), and 9:16 export.",
    howToAr:
      "انسخ ملف المهارة في مشروعك أو في محادثة الـ Agent واكتبله مسار الفيديو بتاعك عشان يجهزه للنشر فورًا.",
    howToEn:
      "Drop into your project skills or chat, provide your raw video path, and let the agent run the clean FFmpeg pipeline.",
    compatAr: "Claude Code · Codex · Gemini CLI · FFmpeg",
    compatEn: "Claude Code · Codex · Gemini CLI · FFmpeg",
    content: `---
name: ffmpeg-smart-editor
description: Automated silence trimming, loudness normalization, and vertical 9:16 export using FFmpeg.
---

# Audio & Video Pipeline
1. Voice Cleanup: Apply highpass=f=80, acompressor, and loudnorm=I=-14:TP=-1.5:LRA=11 for crisp studio voice presence.
2. Silence Detection: Use silencedetect=noise=-32dB:d=0.35 to locate dead pauses before cutting cleanly on keyframes.
3. Export Profile: Encode H.264 (libx264, -crf 18, -pix_fmt yuv420p, -r 30) with AAC 192k audio for zero platform re-compression loss.`,
  },

  /* ===================== 3. DESIGN (PROMPTS + SKILLS) ===================== */
  {
    id: "design-prompt-product",
    num: "01",
    type: "prompt",
    category: "design",
    featured: true,
    fileName: "studio-ad-visual.prompt",
    tagAr: "برومت · تصميم المنتجات والإعلانات",
    tagEn: "Prompt · Commercial Product Visuals",
    titleAr: "برومت توليد صور منتجات وإعلانات بمستوى استوديو تصوير حقيقي",
    titleEn: "Agency-Grade Product & Ad Key Visual Prompt",
    descAr:
      "مجرّب على Flux المجاني وMidjourney: بيطلّع صورة منتج بإضاءة استوديو واقعية ومساحة نظيفة لكتابة العنوان الإعلاني بدون تشويه.",
    descEn:
      "Tested on free Flux & Ideogram plus Midjourney—produces studio-lit product visuals with clean negative space for Arabic or English ad copy.",
    howToAr:
      "انسخ البرومت مباشرة في Flux أو Ideogram أو Midjourney، وبدّل [PRODUCT] بوصف المنتج ولونه.",
    howToEn:
      "Paste directly into Flux, Ideogram, or Midjourney, replacing [PRODUCT] and [SURFACE MATERIAL] with your product details.",
    compatAr: "Flux Free · Ideogram · Leonardo · Midjourney",
    compatEn: "Flux Free · Ideogram · Leonardo · Midjourney",
    content: `Editorial commercial product photography of [PRODUCT], placed on [SURFACE MATERIAL, e.g., warm travertine stone], soft directional morning window light casting crisp diagonal shadows, clean 40% negative space on the upper-right for headline typography, subtle tactile micro-textures, warm alabaster and espresso tones, shot on 85mm f/2.8 macro lens, ultra-sharp commercial studio look, no text, no watermarks, no plastic reflections`,
  },
  {
    id: "design-prompt-thumbnail",
    num: "02",
    type: "prompt",
    category: "design",
    fileName: "high-ctr-thumbnail.prompt",
    tagAr: "برومت · ثامبنيلز وبوسترات",
    tagEn: "Prompt · High-CTR Thumbnails",
    titleAr: "برومت تصميم أفكار وبوسترات Thumbnail تخطف العين في السكرول",
    titleEn: "High-CTR Thumbnail Concept & Visual Prompt",
    descAr:
      "بيديك 3 أفكار بصرية قوية لعنوان الفيديو أو البوستر، ومع كل فكرة بيكتبلك البرومت الدقيق لتوليد الخلفية بتركيز بصري واضح ومساحة للعنوان.",
    descEn:
      "Generates 3 distinct thumbnail visual concepts plus the exact image-generation prompt with high figure-ground separation.",
    howToAr:
      "حط عنوان الفيديو مكان [VIDEO TITLE]، خد الفكرة اللي تعجبك، وانسخ البرومت بتاعها في أداة الصور.",
    howToEn:
      "Replace [VIDEO TITLE] with your video topic, run in ChatGPT/Claude, then paste the chosen prompt into Flux or Midjourney.",
    compatAr: "ChatGPT / Claude + Flux Free / Midjourney",
    compatEn: "ChatGPT / Claude + Flux Free / Midjourney",
    content: `ACT AS: Senior YouTube & Social Art Director.
VIDEO TITLE / TOPIC: [VIDEO TITLE]

Generate 3 high-CTR thumbnail concepts with:
1. Visual Hook (1 clear focal object or emotion—max 3 elements in frame).
2. 2-3 Word Arabic/English Overlay Text (high curiosity, zero clutter).
3. Ready-to-use Image Prompt (Flux / Midjourney) featuring:
   - Strong rim lighting and deep background separation
   - 40% clean negative space on the right for RTL Arabic headline
   - Zero AI-generated garbled text inside the prompt.`,
  },
  {
    id: "design-skill-impeccable",
    num: "01",
    type: "skill",
    category: "design",
    featured: true,
    fileName: "impeccable/SKILL.md",
    installCmd: "npx skills add pbakaus/impeccable",
    sourceLabel: "skills.sh · pbakaus/impeccable",
    tagAr: "مهارة حقيقية (skills.sh) · Design Craft",
    tagEn: "Official Skill (skills.sh) · Design Craft",
    titleAr: "مهارة Impeccable الشهيرة لإخراج تصميمات وواجهات بمستوى أبل",
    titleEn: "Impeccable Design System & Visual Craft Skill",
    descAr:
      "واحدة من أقوى مهارات التصميم على skills.sh: بتراجع التباين، التدرج البصري، الخطوط، والمساحات، وبتديك أوامر زي /polish و /audit لتحسين أي تصميم.",
    descEn:
      "Renowned skills.sh design skill by Paul Bakaus—audits visual hierarchy, typography, contrast, and spacing with /polish, /bolder, and /audit workflows.",
    howToAr:
      "ثبّتها بأمر npx skills add pbakaus/impeccable في مشروعك، أو انسخ قواعدها في تعليمات مشروعك مع الـ AI.",
    howToEn:
      "Install with npx skills add pbakaus/impeccable in your repo or paste into your agent's design instructions.",
    compatAr: "مثبّتة عبر skills.sh · Claude Code · Codex · Cursor",
    compatEn: "Registry: skills.sh · Claude Code · Codex · Cursor",
    content: `---
name: impeccable
source: skills.sh (pbakaus/impeccable)
description: Design craft, visual hierarchy, typography, color discipline, and UX polish skill.
---

# Install Command
npx skills add pbakaus/impeccable

# Key Design Standards
1. Hierarchy First: Every screen must have one unmistakable primary focal point and clear visual weight steps.
2. Quiet Confidence: Replace noisy borders, heavy drop shadows, and badge clutter with crisp spacing and subtle tonal contrast.
3. Real Copy & States: Never ship generic placeholder copy; design realistic empty, loading, and hover states.
4. Self-Audit: Check contrast ratios, mobile tap targets (min 44px), and alignment before finalizing.`,
  },
  {
    id: "design-skill-brand-system",
    num: "02",
    type: "skill",
    category: "design",
    fileName: "brand-art-director/SKILL.md",
    sourceLabel: "Tornado Brand Workflow",
    tagAr: "مهارة (Skill) · الهويات البصرية",
    tagEn: "Skill · Brand Visual Identity",
    titleAr: "مهارة المخرج الفني لتثبيت الهوية البصرية عبر كل إعلانات البراند",
    titleEn: "Brand Art Director & Visual Consistency Skill",
    descAr:
      "بتحوّل الـ AI لمخرج فني يثبّت نفس الألوان والخامات والإضاءة عبر كل بوستات وإعلانات البراند عشان العميل يستلم هوية متماسكة.",
    descEn:
      "Locks brand palette, surface textures, lighting angle, and typography zones across all campaign assets.",
    howToAr:
      "حط ألوان البراند ومجاله في أول المحادثة مع المهارة دي، وكل تصميم بعدها هيطلع بنفس الروح.",
    howToEn:
      "Drop this skill into your AI project with your client's brand colors and product category to lock campaign consistency.",
    compatAr: "Claude · ChatGPT Projects · Midjourney · Flux",
    compatEn: "Claude · ChatGPT Projects · Midjourney · Flux",
    content: `---
name: brand-art-director
description: Lock brand palette, material finish, and lighting direction across an entire social and ad campaign.
---

# Art Direction Protocol
1. Define Brand DNA first: Primary background, Ink tone, Accent color, Material finish (matte stone, brushed metal, smoked glass), and Light direction.
2. Reserve 35%-45% uncluttered negative space for Arabic/English headline placement.
3. Deliver 3 format-ready prompts per concept: 1:1 Feed, 9:16 Story, and 16:9 Web Banner.`,
  },

  /* ===================== 4. MARKETING (PROMPTS + SKILLS) ===================== */
  {
    id: "marketing-prompt-angles",
    num: "01",
    type: "prompt",
    category: "marketing",
    featured: true,
    fileName: "mena-ad-angles.prompt",
    tagAr: "برومت · Media Buying & Ads",
    tagEn: "Prompt · Performance Media Buying",
    titleAr: "برومت استخراج 5 زوايا إعلانية بيّاعة للسوق المصري والعربي",
    titleEn: "MENA Direct-Response Ad Angles & Hooks Generator",
    descAr:
      "بيطلعلك 5 زوايا إعلانية مختلفة لنفس المنتج (مقارنة تكلفة، إثبات سريع، كسر اعتراض، عرض لا يقاوم) بصياغة مصرية/عربية طبيعية تبيع فعلًا.",
    descEn:
      "Produces 5 distinct direct-response ad angles (cost contrast, objection crusher, fast ROI, proof-first) in natural Egyptian/MENA Arabic.",
    howToAr:
      "اكتب اسم المنتج وسعره وأهم ميزة فيه مكان الأقواس [...]، وهتاخد 5 إعلانات كاملة جاهزة للتشغيل على Meta وTikTok.",
    howToEn:
      "Fill in [PRODUCT], [PRICE], and [MAIN RESULT], then run to get 5 ready-to-launch ad scripts for Meta & TikTok.",
    compatAr: "ChatGPT · Claude · Gemini · Meta & TikTok Ads",
    compatEn: "ChatGPT · Claude · Gemini · Meta & TikTok Ads",
    content: `ROLE: Senior Performance Media Buyer specializing in Egypt & MENA direct-response campaigns.

PRODUCT / SERVICE: [PRODUCT]
PRICE & OFFER: [PRICE & GUARANTEE]
TARGET BUYER: [WHO IS BUYING & THEIR #1 FRUSTRATION]

GENERATE 5 DISTINCT AD ANGLES IN NATURAL SPOKEN EGYPTIAN ARABIC:
1. The "Hidden Cost" Angle (exposing what competitors charge monthly vs our offer)
2. The "Objection Crusher" Angle (answering the #1 excuse stopping them from buying)
3. The "Fast ROI / Payback" Angle (how they recover the cost from their first win)
4. The "Zero-Risk Proof" Angle (guarantee + free sample proof)
5. The "Before vs After Workflow" Angle

FOR EACH ANGLE OUTPUT:
- 3-Second Hook (stops the scroll immediately)
- 20-Second Body Copy (conversational, zero clichés)
- Clear CTA + Primary Text for Meta Ads.`,
  },
  {
    id: "marketing-prompt-competitor",
    num: "02",
    type: "prompt",
    category: "marketing",
    fileName: "competitor-teardown.prompt",
    tagAr: "برومت · تحليل المنافسين والعروض",
    tagEn: "Prompt · Competitor & Offer Audit",
    titleAr: "برومت تحليل إعلانات المنافسين وبناء عرض أقوى يكسب السوق",
    titleEn: "Competitor Ad & Offer Gap Analyzer Prompt",
    descAr:
      "بتحطله عرض المنافس أو إعلاناته من Meta Ad Library، وهو بيطلعلك نقاط الضعف اللي سابها المنافس ويبني لك عرض يغلبها فورًا.",
    descEn:
      "Feed it a competitor's landing page or Meta Ad Library copy to extract buyer friction points and craft a stronger counter-offer.",
    howToAr:
      "انسخ كلام إعلان أو صفحة منافسك من Meta Ad Library وحطه مكان [PASTE COMPETITOR COPY].",
    howToEn:
      "Copy a competitor's ad or offer text from Meta Ad Library into [PASTE COMPETITOR COPY] and run.",
    compatAr: "Meta Ad Library + ChatGPT / Claude / Gemini",
    compatEn: "Meta Ad Library + ChatGPT / Claude / Gemini",
    content: `Analyze this competitor offer / ad copy:
[PASTE COMPETITOR COPY OR PRICING]

OUTPUT:
1. Top 3 Friction Points causing buyer hesitation (e.g., recurring lock-in, vague deliverables, zero guarantee).
2. Unclaimed Positioning Gap we can own immediately.
3. Counter-Offer Blueprint (Headline + Risk Reversal + Free Value Hook).
4. 3 Comparison Hooks that highlight our advantage ethically and clearly.`,
  },
  {
    id: "marketing-skill-marketingskills",
    num: "01",
    type: "skill",
    category: "marketing",
    featured: true,
    fileName: "marketingskills/SKILL.md",
    installCmd: "npx skills add coreyhaines31/marketingskills",
    sourceLabel: "skills.sh · coreyhaines31/marketingskills",
    tagAr: "مهارة حقيقية (skills.sh) · CRO & Copywriting",
    tagEn: "Official Skill (skills.sh) · Marketing & CRO",
    titleAr: "حزمة Marketing Skills الشهيرة لتحسين التحويل (CRO) وكتابة الإعلانات",
    titleEn: "Corey Haines Marketing Skills Pack (CRO, Copy & Ads)",
    descAr:
      "أشهر مكتبة مهارات تسويق على skills.sh: بتضم أكتر من 50 playbook لرفع معدل التحويل، كتابة صفحات الهبوط، تحسين الـ SEO، واختبار الإعلانات.",
    descEn:
      "The top marketing registry package on skills.sh—includes conversion rate optimization (CRO), direct-response copywriting, SEO audits, and paid ad testing playbooks.",
    howToAr:
      "ثبّتها بأمر npx skills add coreyhaines31/marketingskills أو انسخ القواعد في محادثة التسويق بتاعتك.",
    howToEn:
      "Install via npx skills add coreyhaines31/marketingskills or copy the framework into your marketing agent.",
    compatAr: "مثبّتة عبر skills.sh · Claude Code · Codex · Cursor",
    compatEn: "Registry: skills.sh · Claude Code · Codex · Cursor",
    content: `---
name: marketingskills
source: skills.sh (coreyhaines31/marketingskills)
description: Production marketing playbooks for CRO, copywriting, paid ads, and growth audits.
---

# Install Command
npx skills add coreyhaines31/marketingskills

# Core Conversion Rules
1. 5-Second Clarity: Above the fold must immediately state Who it's for, What outcome they get, and the Next Action.
2. Specifics Beat Hype: Replace adjectives ("best", "revolutionary") with concrete numbers, free samples, and risk reversal.
3. Creative Testing Matrix: Test 3 distinct angles x 2 hooks; evaluate Thumbstop Rate, CTR, and Cost Per Lead before scaling.
4. Objection Sequence: Answer budget, time, and trust objections right next to the primary CTA.`,
  },
  {
    id: "marketing-skill-cro-audit",
    num: "02",
    type: "skill",
    category: "marketing",
    fileName: "landing-cro-auditor/SKILL.md",
    sourceLabel: "Tornado Growth Workflow",
    tagAr: "مهارة (Skill) · مراجعة صفحات الهبوط",
    tagEn: "Skill · Landing Page CRO Audit",
    titleAr: "مهارة فحص صفحات الهبوط واكتشاف سبب ضعف المبيعات",
    titleEn: "Landing Page Conversion Leak Auditor Skill",
    descAr:
      "بتفحص أي صفحة هبوط أو متجر وتطلعلك أهم 5 أسباب بتخلي الزائر يخرج بدون ما يشتري، مع صياغة بديلة جاهزة فورًا.",
    descEn:
      "Audits any landing page for trust gaps, weak headlines, and checkout friction, then writes exact before/after copy fixes.",
    howToAr:
      "حط رابط أو نص صفحة الهبوط بتاعتك مع المهارة دي واطلب منه يطلعلك تقرير التحسين.",
    howToEn:
      "Paste your landing page copy alongside this skill and ask for a ranked top-5 conversion fix list.",
    compatAr: "Claude · ChatGPT · Gemini · Antigravity",
    compatEn: "Claude · ChatGPT · Gemini · Antigravity",
    content: `---
name: landing-cro-auditor
description: Diagnose landing page drop-offs and produce high-impact copy and structure rewrites.
---

# CRO Audit Checklist
1. Message-to-Ad Match: Does the hero headline deliver on the exact promise of the ad that brought the visitor?
2. Trust & Proof Density: Are there verifiable numbers, guarantees, and try-before-you-buy proof above the fold?
3. Friction Removal: Cut unnecessary form fields and clarify pricing/refund terms right beside the CTA button.
4. Deliverable: Rank Top 5 fixes by revenue impact with exact Before -> After copy.`,
  },
];

export const VAULT_TRACKS: {
  id: VaultCategory;
  ar: string;
  en: string;
}[] = [
  { id: "coding", ar: "البرمجة", en: "Coding" },
  { id: "video", ar: "المونتاج والفيديو", en: "Video & Motion" },
  { id: "design", ar: "الجرافيك ديزاين", en: "Graphic Design" },
  { id: "marketing", ar: "الـ Media Buying", en: "Media Buying" },
];
