<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $menu = [
            [
                'name'        => 'Coffee & Lattes',
                'description' => '12oz · 2 shots of espresso · whole milk',
                'sort_order'  => 1,
                'items'       => [
                    ['name' => 'Blueberry Latte',                  'price' => 6.50, 'description' => 'House blueberry syrup, espresso, and velvety steamed milk. A signature favourite.',           'featured' => true,  'sort' => 1],
                    ['name' => 'Brown Sugar Shaken Espresso',       'price' => 6.50, 'description' => 'Espresso shaken over ice with house brown sugar syrup — bold, sweet, and refreshing.',        'featured' => true,  'sort' => 2],
                    ['name' => 'Mazapán Latte',                    'price' => 6.50, 'description' => 'Inspired by the classic Mexican candy — peanut and almond sweetness in every sip.',           'featured' => false, 'sort' => 3],
                    ['name' => 'Nutella Latte',                    'price' => 6.00, 'description' => 'Rich hazelnut-chocolate syrup blended with espresso and steamed whole milk.',                  'featured' => false, 'sort' => 4],
                    ['name' => 'Spanish Latte',                    'price' => 6.00, 'description' => 'Sweetened condensed milk, espresso, and steamed milk. Creamy, bold, and indulgent.',          'featured' => false, 'sort' => 5],
                    ['name' => 'Cookies & Creme Latte',            'price' => 6.00, 'description' => 'Cookies and cream syrup with espresso and steamed milk — dessert in a cup.',                  'featured' => false, 'sort' => 6],
                    ['name' => 'French Toast Latte',               'price' => 6.00, 'description' => 'Cinnamon, vanilla, and maple notes meet espresso in this comforting morning drink.',           'featured' => false, 'sort' => 7],
                    ['name' => 'Dulce de Leche Latte',             'price' => 6.00, 'description' => 'Silky caramel-milk sweetness from dulce de leche syrup with a double shot of espresso.',      'featured' => false, 'sort' => 8],
                    ['name' => 'Caramel Macchiato',                'price' => 6.00, 'description' => 'Vanilla-sweetened steamed milk, espresso, and a golden caramel drizzle on top.',             'featured' => false, 'sort' => 9],
                    ['name' => 'Mexican Coffee "Café de Olla"',    'price' => 6.00, 'description' => 'Traditional cinnamon and piloncillo notes brewed into a warm, spiced espresso drink.',         'featured' => false, 'sort' => 10],
                    ['name' => 'Cappuccino',                       'price' => 4.75, 'description' => 'Equal parts espresso, steamed milk, and thick velvety foam. A timeless classic.',             'featured' => false, 'sort' => 11],
                    ['name' => 'Americano',                        'price' => 3.00, 'description' => 'Two shots of espresso lengthened with hot water. Clean, bold, and satisfying.',               'featured' => false, 'sort' => 12],
                ],
            ],
            [
                'name'        => 'Lemonade',
                'description' => 'Hand-crafted lemonades made with real fruit and house syrups.',
                'sort_order'  => 2,
                'items'       => [
                    ['name' => 'Blueberry Lemonade (Small 12oz)',   'price' => 3.00, 'description' => 'Fresh lemonade with house blueberry syrup. Bright, fruity, and refreshing.',                 'featured' => false, 'sort' => 1],
                    ['name' => 'Blueberry Lemonade (Large 24oz)',   'price' => 6.00, 'description' => 'Fresh lemonade with house blueberry syrup. Bright, fruity, and refreshing.',                 'featured' => true,  'sort' => 2],
                    ['name' => 'Strawberry Lemonade (Small 12oz)',  'price' => 3.00, 'description' => 'Sweet strawberry purée blended with fresh-squeezed lemonade. Summer in a cup.',              'featured' => false, 'sort' => 3],
                    ['name' => 'Strawberry Lemonade (Large 24oz)',  'price' => 6.00, 'description' => 'Sweet strawberry purée blended with fresh-squeezed lemonade. Summer in a cup.',              'featured' => false, 'sort' => 4],
                ],
            ],
            [
                'name'        => 'Matcha',
                'description' => 'Premium ceremonial-grade matcha, available hot or iced.',
                'sort_order'  => 3,
                'items'       => [
                    ['name' => 'Blueberry Matcha (Small 12oz)',     'price' => 6.50, 'description' => 'Ceremonial matcha whisked with blueberry syrup and steamed milk. Earthy and sweet.',         'featured' => true,  'sort' => 1],
                    ['name' => 'Blueberry Matcha (Large 16oz)',     'price' => 7.50, 'description' => 'Ceremonial matcha whisked with blueberry syrup and steamed milk. Earthy and sweet.',         'featured' => false, 'sort' => 2],
                    ['name' => 'Strawberry Matcha (Small 12oz)',    'price' => 6.50, 'description' => 'Vibrant ceremonial matcha with house strawberry syrup and creamy steamed milk.',             'featured' => false, 'sort' => 3],
                    ['name' => 'Strawberry Matcha (Large 16oz)',    'price' => 7.50, 'description' => 'Vibrant ceremonial matcha with house strawberry syrup and creamy steamed milk.',             'featured' => false, 'sort' => 4],
                ],
            ],
        ];

        foreach ($menu as $catData) {
            $category = MenuCategory::create([
                'name'        => $catData['name'],
                'slug'        => Str::slug($catData['name']),
                'description' => $catData['description'],
                'sort_order'  => $catData['sort_order'],
                'is_active'   => true,
            ]);

            foreach ($catData['items'] as $item) {
                MenuItem::create([
                    'menu_category_id' => $category->id,
                    'name'             => $item['name'],
                    'slug'             => Str::slug($item['name']) . '-' . Str::random(4),
                    'description'      => $item['description'],
                    'price'            => $item['price'],
                    'image_url'        => null,
                    'is_active'        => true,
                    'is_featured'      => $item['featured'],
                    'sort_order'       => $item['sort'],
                ]);
            }
        }
    }
}
