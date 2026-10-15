import { router } from '@inertiajs/react';
import { useLayoutEffect, useState } from 'react';
import { translateText } from './translations';

const textSources = new WeakMap();
const attributeSources = new WeakMap();
const translatedAttributes = ['placeholder', 'aria-label', 'title'];

function isIgnored(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return !element || element.closest('script, style, [data-i18n-ignore]');
}

function translateTextNode(node, locale) {
    if (isIgnored(node)) return;

    const current = node.nodeValue;
    const previous = textSources.get(node);
    const source = previous && current === previous.output ? previous.source : current;
    const output = translateText(source, locale);

    textSources.set(node, { source, output });
    if (current !== output) node.nodeValue = output;
}

function translateElement(element, locale) {
    if (isIgnored(element)) return;

    const previousAttributes = attributeSources.get(element) ?? {};
    const nextAttributes = { ...previousAttributes };

    translatedAttributes.forEach((attribute) => {
        if (!element.hasAttribute(attribute)) return;

        const current = element.getAttribute(attribute);
        const previous = previousAttributes[attribute];
        const source = previous && current === previous.output ? previous.source : current;
        const output = translateText(source, locale);

        nextAttributes[attribute] = { source, output };
        if (current !== output) element.setAttribute(attribute, output);
    });

    attributeSources.set(element, nextAttributes);
}

function translateTree(root, locale) {
    if (root.nodeType === Node.TEXT_NODE) {
        translateTextNode(root, locale);
        return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE || isIgnored(root)) return;

    translateElement(root, locale);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();

    while (node) {
        if (node.nodeType === Node.TEXT_NODE) translateTextNode(node, locale);
        else translateElement(node, locale);
        node = walker.nextNode();
    }
}

export default function LocalizationProvider({ initialLocale = 'id', children }) {
    const [locale, setLocale] = useState(initialLocale);

    useLayoutEffect(() => router.on('success', (event) => {
        setLocale(event.detail.page.props.locale ?? 'id');
    }), []);

    useLayoutEffect(() => {
        document.documentElement.lang = locale;
        translateTree(document.documentElement, locale);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'characterData') {
                    translateTextNode(mutation.target, locale);
                    return;
                }

                if (mutation.type === 'attributes') {
                    translateElement(mutation.target, locale);
                    return;
                }

                mutation.addedNodes.forEach((node) => translateTree(node, locale));
            });
        });

        observer.observe(document.documentElement, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: translatedAttributes,
        });

        return () => observer.disconnect();
    }, [locale]);

    return children;
}
