import { Download, ExternalLink, FileText } from 'lucide-react';
import React, { useState } from 'react';

export function formatFileSize(bytes) {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ChatAttachment({ attachment, isMine = false }) {
    const [previewOpen, setPreviewOpen] = useState(false);

    if (!attachment?.url) return null;

    if (attachment.is_image) {
        return (
            <div className="mt-1.5 overflow-hidden rounded-xl">
                <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="group relative block w-full overflow-hidden rounded-xl text-left focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                    title="Klik untuk melihat gambar penuh"
                >
                    <img
                        src={attachment.url}
                        alt={attachment.name || 'Lampiran gambar'}
                        className="max-h-60 w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <span className="flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                            <ExternalLink className="size-3.5" /> Lihat penuh
                        </span>
                    </div>
                </button>

                {/* Lightbox Modal */}
                {previewOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setPreviewOpen(false)}
                    >
                        <div
                            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-slate-900 p-3 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between pb-2 px-1 text-xs text-slate-300">
                                <span className="truncate max-w-xs font-semibold">{attachment.name || 'Gambar'}</span>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={attachment.name}
                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
                                    >
                                        <Download className="size-3.5" /> Unduh
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewOpen(false)}
                                        className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                            <img
                                src={attachment.url}
                                alt={attachment.name || 'Preview'}
                                className="max-h-[80vh] max-w-[85vw] rounded-xl object-contain mx-auto"
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // PDF attachment
    return (
        <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            download={attachment.name}
            className={`mt-1.5 flex items-center gap-3 rounded-xl p-2.5 transition border ${
                isMine
                    ? 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
            }`}
        >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-rose-500/15 text-rose-600">
                <FileText className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold leading-tight">{attachment.name || 'Dokumen.pdf'}</p>
                <p className={`mt-0.5 text-[10px] ${isMine ? 'text-white/80' : 'text-slate-500'}`}>
                    PDF · {formatFileSize(attachment.size)}
                </p>
            </div>
            <Download className={`size-4 shrink-0 ${isMine ? 'text-white/80' : 'text-slate-400'}`} />
        </a>
    );
}
