export const LOAN_TYPES = [
    { id: "personal", label: "Personal Loans", icon: "💳" },
    { id: "installment", label: "Installment Loans", icon: "📋" },
    { id: "pet", label: "Pet Care Financing", icon: "🐾" },
    { id: "medical", label: "Medical Financing", icon: "🏥" },
    { id: "auto", label: "Auto Loans", icon: "🚗" },
    { id: "custom", label: "Custom / Other", icon: "⚡" },
];

export const COLORS = [
    { id: "ocean", name: "Ocean Trust", p: [217, 91, 35], s: [158, 64, 42], a: [15, 92, 62], bg: [210, 40, 98], fg: [222, 47, 11] },
    { id: "forest", name: "Forest Green", p: [152, 68, 28], s: [45, 93, 47], a: [350, 80, 55], bg: [140, 20, 97], fg: [150, 40, 10] },
    { id: "midnight", name: "Midnight Indigo", p: [235, 70, 42], s: [170, 60, 45], a: [25, 95, 58], bg: [230, 25, 97], fg: [235, 50, 12] },
    { id: "ruby", name: "Ruby Finance", p: [350, 75, 38], s: [200, 70, 45], a: [40, 90, 55], bg: [350, 15, 97], fg: [350, 40, 12] },
    { id: "slate", name: "Slate Modern", p: [215, 25, 35], s: [160, 50, 42], a: [15, 85, 55], bg: [210, 15, 97], fg: [215, 30, 12] },
    { id: "coral", name: "Coral Warm", p: [12, 76, 42], s: [185, 60, 40], a: [265, 65, 55], bg: [20, 30, 97], fg: [15, 40, 12] },
    { id: "teal", name: "Teal Pro", p: [180, 65, 30], s: [280, 55, 55], a: [35, 90, 55], bg: [175, 20, 97], fg: [180, 40, 10] },
    { id: "plum", name: "Plum Finance", p: [270, 55, 40], s: [150, 55, 42], a: [20, 88, 58], bg: [270, 15, 97], fg: [270, 40, 12] },
];

export const FONTS = [
    { id: "dm-sans", name: "DM Sans", import: "DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700", family: '"DM Sans"' },
    { id: "plus-jakarta", name: "Plus Jakarta Sans", import: "Plus+Jakarta+Sans:wght@400;600;700", family: '"Plus Jakarta Sans"' },
    { id: "outfit", name: "Outfit", import: "Outfit:wght@400;500;600;700", family: '"Outfit"' },
    { id: "manrope", name: "Manrope", import: "Manrope:wght@400;500;600;700;800", family: '"Manrope"' },
    { id: "sora", name: "Sora", import: "Sora:wght@400;500;600;700", family: '"Sora"' },
    { id: "figtree", name: "Figtree", import: "Figtree:wght@400;500;600;700", family: '"Figtree"' },
    { id: "inter", name: "Inter", import: "Inter:wght@400;500;600;700", family: '"Inter"' },
    { id: "space-grotesk", name: "Space Grotesk", import: "Space+Grotesk:wght@400;500;600;700", family: '"Space Grotesk"' },
];

export const LAYOUTS = [
    { id: "hero-left", label: "Hero Left + Form Right", desc: "Classic split" },
    { id: "hero-center", label: "Hero Center + Form Below", desc: "Centered modern" },
    { id: "hero-full", label: "Full Width Hero", desc: "Impact first" },
];

export const RADIUS = [
    { id: "sharp", label: "Sharp", v: "0rem" },
    { id: "subtle", label: "Subtle", v: "0.375rem" },
    { id: "rounded", label: "Rounded", v: "0.75rem" },
    { id: "pill", label: "Pill", v: "1.5rem" },
];

export const NETWORKS_AFF = ["LeadsGate", "ZeroParallel", "LeadStack", "ClickDealer", "Everflow", "Custom"];
export const REGISTRARS = ["Namecheap", "GoDaddy", "Cloudflare", "Porkbun", "Other"];
export const STATUSES = ["active", "paused", "suspended", "setup", "expired"];

export const COPY_SETS = [
    { id: "smart", brand: "ElasticCredits", h1: "A Smarter Way", h1span: "to Borrow", sub: "Get approved in minutes. Funds as fast as next business day.", cta: "Check My Rate", badge: "4,200+ funded this month" },
    { id: "fast", brand: "QuickFund", h1: "Fast Cash", h1span: "When You Need It", sub: "Simple application. Quick decisions. Direct deposit.", cta: "Get Started Now", badge: "3,800+ approved this week" },
    { id: "simple", brand: "ClearPath Loans", h1: "Simple Loans,", h1span: "Clear Terms", sub: "No hidden fees. No surprises. Straightforward loans.", cta: "See Your Rate", badge: "5,000+ happy borrowers" },
    { id: "trust", brand: "LoanBridge", h1: "Trusted by", h1span: "Thousands", sub: "Join thousands who found better rates with our lender network.", cta: "Find My Rate", badge: "12,000+ loans funded" },
    { id: "easy", brand: "EasyLend", h1: "Borrowing", h1span: "Made Easy", sub: "2-minute application. All credit types welcome.", cta: "Apply Now Free", badge: "2,900+ served nationwide" },
    { id: "flex", brand: "FlexCredit", h1: "Flexible Loans", h1span: "on Your Terms", sub: "Choose your amount. Pick your timeline. Get funded fast.", cta: "Check Eligibility", badge: "6,100+ customers served" },
];

export const SECTION_ORDERS = [
    { id: "default", name: "Standard", order: ["social", "steps", "calc", "features", "faq", "cta"] },
    { id: "trust-first", name: "Trust First", order: ["social", "features", "steps", "calc", "faq", "cta"] },
    { id: "calc-early", name: "Calc Early", order: ["social", "calc", "steps", "features", "faq", "cta"] },
    { id: "minimal", name: "Minimal", order: ["social", "steps", "faq", "cta"] },
    { id: "faq-early", name: "FAQ Early", order: ["social", "faq", "steps", "calc", "features", "cta"] },
];

export const COMPLIANCE_VARIANTS = [
    { id: "standard", name: "Standard", example: "$1,000 loan, 12mo at 15% APR = $90.26/mo.", apr: "APR 5.99%–35.99%." },
    { id: "detailed", name: "Detailed", example: "$2,500, 24mo at 19.9% APR = ~$127.12/mo.", apr: "5.99%–35.99% APR depending on credit." },
    { id: "simple", name: "Simple", example: "$1,500 for 12mo at 12% APR. $133.28/mo.", apr: "APR 5.99%–35.99%." },
];

export const THEME = {
    bg: "#0b0d14", card: "#12141e", card2: "#181b28", hover: "#1c2030",
    input: "#1a1d2e", border: "#232738", borderFocus: "#6366f1",
    text: "#e2e8f0", muted: "#8892a8", dim: "#5b6478",
    primary: "#6366f1", primaryH: "#818cf8", primaryGlow: "rgba(99,102,241,0.15)",
    accent: "#22d3ee", success: "#10b981", danger: "#ef4444", warning: "#f59e0b",
    grad: "linear-gradient(135deg,#6366f1,#a855f7)",
};
