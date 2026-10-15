export const DEFAULT_THEME_COLOR = '#2563eb';

export const THEME_PRESETS = [
    {
        id: 'blue',
        name: 'Biru Safir',
        description: 'Modern, profesional, dan terpercaya (Bawaan)',
        color: '#2563eb',
    },
    {
        id: 'emerald',
        name: 'Hijau Zamrud',
        description: 'Segar, alami, ramah lingkungan, dan organik',
        color: '#059669',
    },
    {
        id: 'violet',
        name: 'Ungu Elegan',
        description: 'Mewah, eksklusif, kreatif, dan berkelas',
        color: '#7c3aed',
    },
    {
        id: 'rose',
        name: 'Merah Delima',
        description: 'Berani, dinamis, energik, dan penuh semangat',
        color: '#e11d48',
    },
    {
        id: 'amber',
        name: 'Oranye Senja',
        description: 'Hangat, ramah, antusias, dan bersahabat',
        color: '#ea580c',
    },
    {
        id: 'teal',
        name: 'Teal Samudra',
        description: 'Tenang, sejuk, modern, dan stabil',
        color: '#0d9488',
    },
    {
        id: 'indigo',
        name: 'Indigo Malam',
        description: 'Dalam, berwibawa, tegas, dan berteknologi tinggi',
        color: '#4f46e5',
    },
    {
        id: 'slate',
        name: 'Hitam Arang',
        description: 'Minimalis, monokromatik, dan kontemporer',
        color: '#334155',
    },
];

export function sanitizeHex(hex) {
    if (!hex) return DEFAULT_THEME_COLOR;
    let clean = String(hex).trim();
    if (!clean.startsWith('#')) clean = `#${clean}`;
    if (/^#[a-f0-9]{6}$/i.test(clean)) return clean.toLowerCase();
    if (/^#[a-f0-9]{3}$/i.test(clean)) {
        const r = clean[1] + clean[1];
        const g = clean[2] + clean[2];
        const b = clean[3] + clean[3];
        return `#${r}${g}${b}`.toLowerCase();
    }
    return DEFAULT_THEME_COLOR;
}

function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    return [
        parseInt(clean.slice(0, 2), 16),
        parseInt(clean.slice(2, 4), 16),
        parseInt(clean.slice(4, 6), 16),
    ];
}

function rgbToHex(r, g, b) {
    const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function generatePalette(hex) {
    const primary = sanitizeHex(hex);
    const [r, g, b] = hexToRgb(primary);

    const hover = rgbToHex(r * 0.82, g * 0.82, b * 0.82);
    const light = rgbToHex(r + (255 - r) * 0.2, g + (255 - g) * 0.2, b + (255 - b) * 0.2);
    const subtle = rgbToHex(255 - (255 - r) * 0.07, 255 - (255 - g) * 0.07, 255 - (255 - b) * 0.07);
    const border = rgbToHex(255 - (255 - r) * 0.16, 255 - (255 - g) * 0.16, 255 - (255 - b) * 0.16);
    const borderStrong = rgbToHex(255 - (255 - r) * 0.28, 255 - (255 - g) * 0.28, 255 - (255 - b) * 0.28);

    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const foreground = luminance > 0.65 ? '#0f172a' : '#ffffff';

    return {
        primary,
        hover,
        light,
        subtle,
        border,
        borderStrong,
        foreground,
        ring: primary,
        rgb: `${r}, ${g}, ${b}`,
    };
}

export function applyTheme(hex) {
    if (typeof document === 'undefined') return;
    const palette = generatePalette(hex);
    const root = document.documentElement;

    root.style.setProperty('--brand-color', palette.primary);
    root.style.setProperty('--brand-hover', palette.hover);
    root.style.setProperty('--brand-light', palette.light);
    root.style.setProperty('--brand-subtle', palette.subtle);
    root.style.setProperty('--brand-border', palette.border);
    root.style.setProperty('--brand-border-strong', palette.borderStrong);
    root.style.setProperty('--brand-foreground', palette.foreground);
    root.style.setProperty('--brand-rgb', palette.rgb);
    root.style.setProperty('--primary', palette.primary);
    root.style.setProperty('--primary-foreground', palette.foreground);
    root.style.setProperty('--ring', palette.primary);
    root.style.setProperty('--color-primary', palette.primary);
    root.style.setProperty('--color-primary-foreground', palette.foreground);
    root.style.setProperty('--color-blue-600', palette.primary);
    root.style.setProperty('--color-blue-700', palette.hover);
    root.style.setProperty('--color-blue-500', palette.light);
    root.style.setProperty('--color-blue-400', palette.light);
    root.style.setProperty('--color-blue-300', palette.borderStrong);
    root.style.setProperty('--color-blue-50', palette.subtle);
    root.style.setProperty('--color-blue-100', palette.border);
    root.style.setProperty('--color-blue-200', palette.borderStrong);
}
