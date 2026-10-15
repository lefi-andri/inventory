import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { currency } from '@/lib/format';
import { Package, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ProductDetailDialog({ product, onClose, onAdd }) {
    const [activeImage, setActiveImage] = useState(null);
    const images = product?.images?.length ? product.images : product?.image ? [product.image] : [];

    useEffect(() => {
        setActiveImage(images[0] || null);
    }, [product?.id]);

    const addToCart = () => {
        onAdd?.(product);
        onClose();
    };

    return (
        <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
            {product && <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Detail produk</DialogTitle>
                    <DialogDescription>Informasi lengkap dan ketersediaan produk saat ini.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div>
                        <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
                            {activeImage
                                ? <img src={activeImage} alt={product.name} className="h-full w-full object-cover" />
                                : <div className="grid h-full place-items-center text-slate-400"><Package className="size-16" /></div>}
                        </div>
                        {images.length > 1 && <div className="mt-3 grid grid-cols-4 gap-2">{images.map((image) => <button key={image} type="button" onClick={() => setActiveImage(image)} className={`aspect-square overflow-hidden rounded-xl border-2 ${activeImage === image ? 'border-blue-600' : 'border-transparent'}`}><img src={image} alt="" className="h-full w-full object-cover" /></button>)}</div>}
                    </div>

                    <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider"><span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{product.category || 'Tanpa kategori'}</span><span className="text-slate-400">{product.sku}</span></div>
                        <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">{product.name}</h2>
                        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{product.description || 'Belum ada deskripsi produk.'}</p>
                        <div className="mt-6 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Harga</p><p className="mt-1 text-2xl font-black text-blue-600">{currency(product.price)}</p><p className={`mt-2 text-sm font-semibold ${product.stock > 0 ? 'text-emerald-700' : 'text-red-600'}`}>{product.stock > 0 ? `${product.stock} unit tersedia` : 'Stok habis'}</p></div>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Tutup</Button>
                    {onAdd && product.is_active !== false && !product.is_discontinued && product.stock > 0 && <Button type="button" onClick={addToCart} className="bg-blue-600 hover:bg-blue-700"><ShoppingBag /> Tambah ke keranjang</Button>}
                </DialogFooter>
            </DialogContent>}
        </Dialog>
    );
}
