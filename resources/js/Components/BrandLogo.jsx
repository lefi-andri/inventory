import { usePage } from '@inertiajs/react';
import { ShoppingBag } from 'lucide-react';

export default function BrandLogo({ className = 'size-10 rounded-xl', fallbackClassName = 'bg-blue-600 text-white', imageClassName = 'p-1', iconClassName = 'size-5', alt }) {
    const site = usePage().props.site || {};

    return (
        <span className={`grid shrink-0 place-items-center overflow-hidden ${className} ${site.logo ? 'bg-white' : fallbackClassName}`}>
            {site.logo
                ? <img src={site.logo} alt={alt || `Logo ${site.brand_name || 'toko'}`} className={`h-full w-full object-contain ${imageClassName}`} />
                : <ShoppingBag className={iconClassName} />}
        </span>
    );
}
