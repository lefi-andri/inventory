<?php

namespace App\Http\Controllers;

use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $lowStockQuery = Product::query()
            ->where('is_discontinued', false)
            ->whereColumn('stock', '<=', 'low_stock_threshold');

        return Inertia::render('Dashboard', [
            'stats' => [
                'revenue' => (float) Order::where('payment_status', 'paid')->sum('total'),
                'orders' => Order::count(),
                'products' => Product::count(),
                'low_stock' => (clone $lowStockQuery)->count(),
            ],
            'lowStock' => (clone $lowStockQuery)->with('category')->orderBy('stock')->limit(5)->get()->map(fn ($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'stock' => $product->stock,
                'threshold' => $product->low_stock_threshold,
                'category' => $product->category?->name,
            ]),
            'recentOrders' => Order::latest()->limit(6)->get(['id', 'order_number', 'customer_name', 'status', 'payment_status', 'total', 'created_at']),
            'recentMovements' => InventoryMovement::with('product')->latest()->limit(6)->get()->map(fn ($movement) => [
                'id' => $movement->id,
                'product' => $movement->product?->name,
                'type' => $movement->type,
                'quantity' => $movement->quantity,
                'after_stock' => $movement->after_stock,
                'created_at' => $movement->created_at,
            ]),
        ]);
    }
}
