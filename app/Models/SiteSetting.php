<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class SiteSetting extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = [
        'brand_name',
        'navbar_links',
        'footer_description',
        'footer_copyright',
        'footer_links',
    ];

    protected function casts(): array
    {
        return [
            'navbar_links' => 'array',
            'footer_links' => 'array',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('site-logo')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public static function current(): self
    {
        return static::query()->first() ?? static::query()->create([
            'brand_name' => 'Stokara',
            'navbar_links' => static::defaultNavbarLinks(),
            'footer_description' => 'Produk fungsional untuk keseharian modern.',
            'footer_copyright' => '© '.now()->year.' Stokara. Semua hak dilindungi.',
            'footer_links' => [],
        ]);
    }

    public static function defaultNavbarLinks(): array
    {
        return [
            ['label' => 'Produk', 'url' => '#produk', 'is_active' => true],
            ['label' => 'Layanan', 'url' => '#benefit', 'is_active' => true],
        ];
    }

    public function toSharedArray(): array
    {
        return [
            'brand_name' => $this->brand_name,
            'logo' => $this->getFirstMediaUrl('site-logo') ?: null,
            'navbar_links' => $this->navbar_links ?? self::defaultNavbarLinks(),
            'footer_description' => $this->footer_description,
            'footer_copyright' => $this->footer_copyright,
            'footer_links' => $this->footer_links ?? [],
        ];
    }
}
