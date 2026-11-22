import localFont from "next/font/local";

export const thmanyahSans = localFont({
  src: [
    { path: "./fonts/ThmanyahSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ThmanyahSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ThmanyahSans-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-thmanyah-sans",
  display: "swap",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+06??, U+0750-077F, U+0870-089F, U+08A0-08FF, U+200C-200F, U+FB50-FDFF, U+FE70-FEFF, U+1EE??",
    },
  ],
});

export const thmanyahDisplay = localFont({
  src: [
    { path: "./fonts/ThmanyahDisplay-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ThmanyahDisplay-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-thmanyah-display",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const bricolage = localFont({
  src: "./fonts/BricolageGrotesque.ttf",
  weight: "200 800",
  variable: "--font-bricolage",
  display: "swap",
});

export const instrument = localFont({
  src: "./fonts/InstrumentSans.woff2",
  weight: "400 700",
  variable: "--font-latin",
  display: "swap",
});

export const qurova = localFont({
  src: [
    { path: "./fonts/Qurova-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Qurova-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Qurova-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-latin-display",
  display: "swap",
});

export const fontVariables = [
  thmanyahSans.variable,
  thmanyahDisplay.variable,
  bricolage.variable,
  instrument.variable,
  qurova.variable,
].join(" ");
