<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Product extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'category_id', 'name', 'slug', 'sku', 'description', 'translations', 'price', 'cost',
        'stock', 'low_stock_threshold', 'is_active', 'is_discontinued',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'cost' => 'decimal:2',
            'is_active' => 'boolean',
            'is_discontinued' => 'boolean',
            'translations' => 'array',
        ];
    }

    public function localizedName(?string $locale = null): string
    {
        $locale = $locale ?? app()->getLocale();
        $translations = $this->translations ?? [];

        if (! empty($translations[$locale]['name'])) {
            return (string) $translations[$locale]['name'];
        }

        if (! empty($translations['id']['name'])) {
            return (string) $translations['id']['name'];
        }

        return (string) $this->name;
    }

    public function localizedDescription(?string $locale = null): ?string
    {
        $locale = $locale ?? app()->getLocale();
        $translations = $this->translations ?? [];

        if (isset($translations[$locale]['description']) && $translations[$locale]['description'] !== '') {
            return (string) $translations[$locale]['description'];
        }

        if (isset($translations['id']['description']) && $translations['id']['description'] !== '') {
            return (string) $translations['id']['description'];
        }

        return $this->description;
    }

    public function hasTranslation(string $locale): bool
    {
        $translations = $this->translations ?? [];

        return ! empty($translations[$locale]['name']);
    }

    public function scopeVisibleToCustomers(Builder $query): Builder
    {
        return $query
            ->where('is_active', true)
            ->where('is_discontinued', false);
    }

    public function scopeAvailableForSale(Builder $query): Builder
    {
        return $query
            ->visibleToCustomers()
            ->where('stock', '>', 0);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('products')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }
}
