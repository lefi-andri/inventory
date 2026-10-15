<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'body',
        'attachment_path',
        'attachment_name',
        'attachment_mime',
        'attachment_size',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'attachment_size' => 'integer',
            'read_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::deleting(function (ChatMessage $message) {
            if ($message->attachment_path && Storage::disk('public')->exists($message->attachment_path)) {
                Storage::disk('public')->delete($message->attachment_path);
            }
        });
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function toAttachmentArray(): ?array
    {
        if (! $this->attachment_path) {
            return null;
        }

        return [
            'url' => Storage::disk('public')->url($this->attachment_path),
            'name' => $this->attachment_name,
            'mime' => $this->attachment_mime,
            'size' => $this->attachment_size,
            'is_image' => str_starts_with($this->attachment_mime ?? '', 'image/'),
            'is_pdf' => $this->attachment_mime === 'application/pdf',
        ];
    }
}
