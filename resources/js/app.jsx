import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import LocalizationProvider from './i18n/LocalizationProvider';
import { applyTheme } from './lib/theme';

const fallbackAppName = import.meta.env.VITE_APP_NAME || 'Stokara';
let appName = fallbackAppName;

export function updateFavicon(url) {
    if (!url) return;
    let link = document.querySelector('link#dynamic-favicon') || document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.id = 'dynamic-favicon';
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.removeAttribute('type');
    link.href = url;
}

router.on('navigate', (event) => {
    const themeColor = event.detail.page.props.site?.theme_color;
    if (themeColor) {
        applyTheme(themeColor);
    }
    const favicon = event.detail.page.props.site?.favicon;
    if (favicon) {
        updateFavicon(favicon);
    }
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        appName = props.initialPage.props.site?.brand_name || fallbackAppName;
        const fallbackSuffix = ` - ${fallbackAppName}`;
        if (document.title.endsWith(fallbackSuffix)) {
            document.title = `${document.title.slice(0, -fallbackSuffix.length)} - ${appName}`;
        }

        const initialThemeColor = props.initialPage.props.site?.theme_color;
        if (initialThemeColor) {
            applyTheme(initialThemeColor);
        }

        const initialFavicon = props.initialPage.props.site?.favicon;
        if (initialFavicon) {
            updateFavicon(initialFavicon);
        }

        const root = createRoot(el);

        document.documentElement.lang = props.initialPage.props.locale || 'id';
        root.render(
            <LocalizationProvider initialLocale={props.initialPage.props.locale}>
                <App {...props} />
            </LocalizationProvider>,
        );
    },
    progress: {
        color: '#2563eb',
    },
});
