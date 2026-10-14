<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'dashboard.view', 'products.view', 'products.create', 'products.update', 'products.delete',
            'inventory.view', 'inventory.adjust', 'orders.view', 'orders.update', 'users.view', 'users.manage',
        ];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $inventoryRole = Role::firstOrCreate(['name' => 'inventory-manager', 'guard_name' => 'web']);
        $salesRole = Role::firstOrCreate(['name' => 'sales', 'guard_name' => 'web']);
        $customerRole = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        $adminRole->syncPermissions($permissions);
        $inventoryRole->syncPermissions(['dashboard.view', 'products.view', 'products.create', 'products.update', 'inventory.view', 'inventory.adjust', 'orders.view']);
        $salesRole->syncPermissions(['dashboard.view', 'products.view', 'orders.view', 'orders.update']);
        $customerRole->syncPermissions([]);

        $admin = User::updateOrCreate(['email' => 'admin@stokara.id'], [
            'name' => 'Admin Stokara',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $admin->syncRoles([$adminRole]);

        $inventoryUser = User::updateOrCreate(['email' => 'gudang@stokara.id'], [
            'name' => 'Rina Gudang',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $inventoryUser->syncRoles([$inventoryRole]);

        $salesUser = User::updateOrCreate(['email' => 'sales@stokara.id'], [
            'name' => 'Dimas Sales',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $salesUser->syncRoles([$salesRole]);

        $categoryData = [
            ['name' => 'Home Living', 'description' => 'Produk praktis untuk rumah modern.'],
            ['name' => 'Aksesoris', 'description' => 'Aksesoris harian pilihan.'],
            ['name' => 'Elektronik', 'description' => 'Perangkat elektronik ringkas dan terpercaya.'],
        ];
        $categories = collect($categoryData)->mapWithKeys(function ($data) {
            $category = Category::updateOrCreate(['slug' => Str::slug($data['name'])], $data);

            return [$data['name'] => $category];
        });

        $products = [
            ['category' => 'Home Living', 'name' => 'Aroma Diffuser Sora', 'sku' => 'HOM-001', 'description' => 'Diffuser ultrasonik 300 ml dengan pencahayaan lembut.', 'price' => 329000, 'cost' => 205000, 'stock' => 18, 'low_stock_threshold' => 5],
            ['category' => 'Home Living', 'name' => 'Lampu Meja Nami', 'sku' => 'HOM-002', 'description' => 'Lampu meja minimal dengan tiga tingkat kecerahan.', 'price' => 459000, 'cost' => 290000, 'stock' => 4, 'low_stock_threshold' => 5],
            ['category' => 'Aksesoris', 'name' => 'Tumbler Kiyo 600ml', 'sku' => 'ACC-001', 'description' => 'Tumbler stainless berinsulasi untuk aktivitas harian.', 'price' => 189000, 'cost' => 98000, 'stock' => 32, 'low_stock_threshold' => 8],
            ['category' => 'Elektronik', 'name' => 'Portable Speaker Raku', 'sku' => 'ELC-001', 'description' => 'Speaker Bluetooth ringkas dengan daya tahan 12 jam.', 'price' => 649000, 'cost' => 410000, 'stock' => 3, 'low_stock_threshold' => 5],
            ['category' => 'Aksesoris', 'name' => 'Organizer Kabel Mino', 'sku' => 'ACC-002', 'description' => 'Organizer meja modular untuk kabel dan perangkat kecil.', 'price' => 79000, 'cost' => 35000, 'stock' => 45, 'low_stock_threshold' => 10],
        ];

        $inventory = app(InventoryService::class);
        DB::transaction(function () use ($products, $categories, $admin, $inventory) {
            foreach ($products as $data) {
                $category = $categories[$data['category']];
                $initialStock = (int) $data['stock'];
                unset($data['category'], $data['stock']);

                $product = Product::firstOrNew(['sku' => $data['sku']]);
                $isNew = ! $product->exists;
                $product->fill([
                    ...$data,
                    'category_id' => $category->id,
                    'slug' => Str::slug($data['name']),
                    'is_active' => true,
                ]);

                if ($isNew) {
                    $product->stock = 0;
                }

                $product->save();

                if ($isNew && $initialStock > 0) {
                    $inventory->apply(
                        product: $product,
                        quantity: $initialStock,
                        type: 'opening_balance',
                        userId: $admin->id,
                        notes: 'Stok awal data contoh',
                    );
                }
            }
        });

        if (Order::doesntExist()) {
            DB::transaction(function () use ($admin, $inventory) {
                $product = Product::query()->lockForUpdate()->where('sku', 'ACC-001')->firstOrFail();
                $order = Order::create([
                    'order_number' => 'ORD-'.now()->format('ymd').'-DEMO01',
                    'customer_name' => 'Nadia Putri',
                    'customer_email' => 'nadia@example.com',
                    'customer_phone' => '081234567890',
                    'shipping_address' => 'Jl. Senopati No. 18, Jakarta Selatan',
                    'status' => 'processing',
                    'payment_status' => 'paid',
                    'subtotal' => $product->price * 2,
                    'shipping_cost' => 25000,
                    'total' => ($product->price * 2) + 25000,
                ]);
                $order->items()->create([
                    'product_id' => $product->id, 'product_name' => $product->name, 'sku' => $product->sku,
                    'price' => $product->price, 'quantity' => 2, 'subtotal' => $product->price * 2,
                ]);
                $inventory->apply(
                    product: $product,
                    quantity: -2,
                    type: 'order_reservation',
                    userId: $admin->id,
                    reference: $order->order_number,
                    notes: 'Stok dialokasikan untuk data contoh pesanan',
                );
            });
        }
    }
}
