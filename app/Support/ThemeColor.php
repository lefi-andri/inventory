<?php

namespace App\Support;

class ThemeColor
{
    public const DEFAULT_COLOR = '#2563eb';

    public const PRESETS = [
        [
            'id' => 'blue',
            'name' => 'Biru Safir',
            'description' => 'Modern, profesional, dan terpercaya (Bawaan)',
            'color' => '#2563eb',
        ],
        [
            'id' => 'emerald',
            'name' => 'Hijau Zamrud',
            'description' => 'Segar, alami, ramah lingkungan, dan organik',
            'color' => '#059669',
        ],
        [
            'id' => 'violet',
            'name' => 'Ungu Elegan',
            'description' => 'Mewah, eksklusif, kreatif, dan berkelas',
            'color' => '#7c3aed',
        ],
        [
            'id' => 'rose',
            'name' => 'Merah Delima',
            'description' => 'Berani, dinamis, energik, dan penuh semangat',
            'color' => '#e11d48',
        ],
        [
            'id' => 'amber',
            'name' => 'Oranye Senja',
            'description' => 'Hangat, ramah, antusias, dan bersahabat',
            'color' => '#ea580c',
        ],
        [
            'id' => 'teal',
            'name' => 'Teal Samudra',
            'description' => 'Tenang, sejuk, modern, dan stabil',
            'color' => '#0d9488',
        ],
        [
            'id' => 'indigo',
            'name' => 'Indigo Malam',
            'description' => 'Dalam, berwibawa, tegas, dan berteknologi tinggi',
            'color' => '#4f46e5',
        ],
        [
            'id' => 'slate',
            'name' => 'Hitam Arang',
            'description' => 'Minimalis, monokromatik, dan kontemporer',
            'color' => '#334155',
        ],
    ];

    public static function sanitize(?string $hex): string
    {
        if (! $hex) {
            return self::DEFAULT_COLOR;
        }

        $hex = trim($hex);
        if (! str_starts_with($hex, '#')) {
            $hex = '#'.$hex;
        }

        if (preg_match('/^#[a-f0-9]{6}$/i', $hex)) {
            return strtolower($hex);
        }

        if (preg_match('/^#[a-f0-9]{3}$/i', $hex)) {
            $r = $hex[1].$hex[1];
            $g = $hex[2].$hex[2];
            $b = $hex[3].$hex[3];

            return strtolower("#{$r}{$g}{$b}");
        }

        return self::DEFAULT_COLOR;
    }

    public static function generatePalette(?string $hex): array
    {
        $primary = self::sanitize($hex);
        [$r, $g, $b] = self::hexToRgb($primary);

        // Hover: ~15% darker
        $hover = self::rgbToHex(
            (int) round($r * 0.82),
            (int) round($g * 0.82),
            (int) round($b * 0.82)
        );

        // Light: ~12% brighter
        $light = self::rgbToHex(
            (int) min(255, round($r + (255 - $r) * 0.2)),
            (int) min(255, round($g + (255 - $g) * 0.2)),
            (int) min(255, round($b + (255 - $b) * 0.2))
        );

        // Subtle tint (like blue-50, ~93% white mix)
        $subtle = self::rgbToHex(
            (int) round(255 - (255 - $r) * 0.07),
            (int) round(255 - (255 - $g) * 0.07),
            (int) round(255 - (255 - $b) * 0.07)
        );

        // Border tint (like blue-100, ~84% white mix)
        $border = self::rgbToHex(
            (int) round(255 - (255 - $r) * 0.16),
            (int) round(255 - (255 - $g) * 0.16),
            (int) round(255 - (255 - $b) * 0.16)
        );

        // Stronger border (like blue-200, ~72% white mix)
        $borderStrong = self::rgbToHex(
            (int) round(255 - (255 - $r) * 0.28),
            (int) round(255 - (255 - $g) * 0.28),
            (int) round(255 - (255 - $b) * 0.28)
        );

        // Foreground: determine contrast
        $luminance = (0.2126 * $r + 0.7152 * $g + 0.0722 * $b) / 255;
        $foreground = $luminance > 0.65 ? '#0f172a' : '#ffffff';

        return [
            'primary' => $primary,
            'hover' => $hover,
            'light' => $light,
            'subtle' => $subtle,
            'border' => $border,
            'border_strong' => $borderStrong,
            'foreground' => $foreground,
            'ring' => $primary,
            'rgb' => "{$r}, {$g}, {$b}",
        ];
    }

    public static function toCss(?string $hex): string
    {
        $palette = self::generatePalette($hex);

        return implode('; ', [
            "--brand-color: {$palette['primary']}",
            "--brand-hover: {$palette['hover']}",
            "--brand-light: {$palette['light']}",
            "--brand-subtle: {$palette['subtle']}",
            "--brand-border: {$palette['border']}",
            "--brand-border-strong: {$palette['border_strong']}",
            "--brand-foreground: {$palette['foreground']}",
            "--brand-rgb: {$palette['rgb']}",
            "--primary: {$palette['primary']}",
            "--primary-foreground: {$palette['foreground']}",
            "--ring: {$palette['primary']}",
            "--color-primary: {$palette['primary']}",
            "--color-primary-foreground: {$palette['foreground']}",
            "--color-blue-600: {$palette['primary']}",
            "--color-blue-700: {$palette['hover']}",
            "--color-blue-500: {$palette['light']}",
            "--color-blue-400: {$palette['light']}",
            "--color-blue-300: {$palette['border_strong']}",
            "--color-blue-50: {$palette['subtle']}",
            "--color-blue-100: {$palette['border']}",
            "--color-blue-200: {$palette['border_strong']}",
        ]);
    }

    private static function hexToRgb(string $hex): array
    {
        $hex = ltrim($hex, '#');

        return [
            hexdec(substr($hex, 0, 2)),
            hexdec(substr($hex, 2, 2)),
            hexdec(substr($hex, 4, 2)),
        ];
    }

    private static function rgbToHex(int $r, int $g, int $b): string
    {
        return sprintf('#%02x%02x%02x', $r, $g, $b);
    }
}
