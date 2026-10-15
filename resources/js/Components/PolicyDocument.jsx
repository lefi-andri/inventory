import { ShieldCheck } from 'lucide-react';
import React, { useMemo } from 'react';

export default function PolicyDocument({ title, content }) {
    const { sections, toc } = useMemo(() => {
        if (!content) return { sections: [], toc: [] };

        const lines = content.split('\n');
        const parsed = [];
        const tableOfContents = [];
        let currentSection = { id: 'intro', title: 'Pendahuluan', lines: [] };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
                if (currentSection.lines.length > 0) {
                    parsed.push(currentSection);
                }
                const headingText = trimmed.replace(/^#{2,3}\s+/, '');
                const id = 'section-' + (tableOfContents.length + 1);
                tableOfContents.push({ id, title: headingText });
                currentSection = { id, title: headingText, lines: [] };
            } else {
                currentSection.lines.push(line);
            }
        }

        if (currentSection.lines.length > 0) {
            parsed.push(currentSection);
        }

        return { sections: parsed, toc: tableOfContents };
    }, [content]);

    return (
        <div className="grid gap-10 lg:grid-cols-[260px_1fr] lg:items-start">
            {/* Table of Contents - Desktop sticky */}
            {toc.length > 0 && (
                <aside className="hidden lg:sticky lg:top-24 lg:block">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                            <ShieldCheck className="size-4 text-blue-600" />
                            <span>Daftar Bagian</span>
                        </div>
                        <nav className="mt-4 space-y-2 text-sm">
                            {toc.map((item) => (
                                <a
                                    key={item.id}
                                    href={`#${item.id}`}
                                    className="block rounded-lg px-2.5 py-1.5 font-medium text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 truncate"
                                >
                                    {item.title}
                                </a>
                            ))}
                        </nav>
                    </div>
                </aside>
            )}

            {/* Document Body */}
            <article className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
                <div className="space-y-8">
                    {sections.map((section) => (
                        <section key={section.id} id={section.id} className="scroll-mt-24">
                            {section.id !== 'intro' && (
                                <h3 className="mb-4 text-xl font-extrabold tracking-tight text-slate-900 border-b border-slate-100 pb-2">
                                    {section.title}
                                </h3>
                            )}
                            <div className="space-y-3.5 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                                {renderLines(section.lines)}
                            </div>
                        </section>
                    ))}
                </div>
            </article>
        </div>
    );
}

function renderLines(lines) {
    const elements = [];
    let listItems = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="my-3 space-y-2 pl-2">
                    {listItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-2.5">
                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-600" />
                            <span>{parseInline(item)}</span>
                        </li>
                    ))}
                </ul>
            );
            listItems = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            listItems.push(trimmed.slice(2));
            continue;
        }

        flushList();

        if (trimmed.startsWith('# ')) {
            elements.push(
                <h1 key={i} className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    {trimmed.slice(2)}
                </h1>
            );
        } else if (trimmed.startsWith('#### ')) {
            elements.push(
                <h4 key={i} className="mt-4 text-base font-bold text-slate-900">
                    {trimmed.slice(5)}
                </h4>
            );
        } else if (trimmed === '---') {
            elements.push(<hr key={i} className="my-6 border-slate-200" />);
        } else if (trimmed.length > 0) {
            elements.push(
                <p key={i} className="text-slate-600">
                    {parseInline(trimmed)}
                </p>
            );
        }
    }

    flushList();
    return elements;
}

function parseInline(text) {
    // Splits text by bold pattern **bold**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return (
                <strong key={index} className="font-extrabold text-slate-900">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return part;
    });
}
