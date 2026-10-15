import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import LocalizationProvider from './i18n/LocalizationProvider';

const fallbackAppName = import.meta.env.VITE_APP_NAME || 'Stokara';
let appName = fallbackAppName;

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

        const root = createRoot(el);

        document.documentElement.lang = props.initialPage.props.locale || 'id';
        root.render(
            <LocalizationProvider initialLocale={props.initialPage.props.locale}>
                <App {...props} />
            </LocalizationProvider>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
