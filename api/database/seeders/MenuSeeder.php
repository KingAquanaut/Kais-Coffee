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
                'description' => '12 oz · 2 shots of espresso · whole milk · Oat milk +$1 · 16 oz upgrade +$1',
                'sort_order'  => 1,
                'items'       => [
                    [
                        'name'        => 'Blueberry Latte',
                        'name_es'     => 'Latte de Arándano',
                        'price'       => 6.50,
                        'description' => 'House blueberry sauce layered with espresso and whole milk — a signature favourite.',
                        'featured'    => true,
                        'sort'        => 1,
                    ],
                    [
                        'name'        => 'Brown Sugar Shaken Espresso',
                        'name_es'     => 'Espresso Agitado con Azúcar Morena',
                        'price'       => 6.50,
                        'description' => 'Espresso shaken over brown sugar and ice, topped with vanilla cold foam and a dash of cinnamon.',
                        'featured'    => true,
                        'sort'        => 2,
                    ],
                    [
                        'name'        => 'Mazapán Latte',
                        'name_es'     => 'Latte de Mazapán',
                        'price'       => 6.50,
                        'description' => 'Inspired by the classic Mexican candy — mazapán powder dissolved in espresso with caramel syrup and steamed milk.',
                        'featured'    => true,
                        'sort'        => 3,
                    ],
                    [
                        'name'        => 'Nutella Latte',
                        'name_es'     => 'Latte de Nutella',
                        'price'       => 6.00,
                        'description' => 'Nutella drizzled around the cup with hazelnut syrup, espresso, and steamed whole milk.',
                        'featured'    => false,
                        'sort'        => 4,
                    ],
                    [
                        'name'        => 'Spanish Latte',
                        'name_es'     => 'Latte Español',
                        'price'       => 6.00,
                        'description' => 'Sweetened condensed milk, espresso, and steamed milk with a touch of cinnamon. Creamy and indulgent.',
                        'featured'    => false,
                        'sort'        => 5,
                    ],
                    [
                        'name'        => 'Cookies & Creme Latte',
                        'name_es'     => 'Latte de Galletas y Crema',
                        'price'       => 6.00,
                        'description' => 'Chocolate drizzle, crumbled cookies, vanilla syrup, and whipping cream — dessert in a cup.',
                        'featured'    => false,
                        'sort'        => 6,
                    ],
                    [
                        'name'        => 'French Toast Latte',
                        'name_es'     => 'Latte de Tostada Francesa',
                        'price'       => 6.00,
                        'description' => 'Maple syrup and brown sugar with espresso and steamed milk, finished with a cinnamon-sugar sprinkle.',
                        'featured'    => false,
                        'sort'        => 7,
                    ],
                    [
                        'name'        => 'Dulce de Leche Latte',
                        'name_es'     => 'Latte de Dulce de Leche',
                        'price'       => 6.00,
                        'description' => 'Dulce de leche drizzled around the cup with vanilla syrup, espresso, and steamed milk, topped with cinnamon and nutmeg.',
                        'featured'    => false,
                        'sort'        => 8,
                    ],
                    [
                        'name'        => 'Caramel Macchiato',
                        'name_es'     => 'Macchiato de Caramelo',
                        'price'       => 6.00,
                        'description' => 'Caramel-drizzled cup, caramel syrup, and steamed milk topped with espresso and a golden caramel drizzle.',
                        'featured'    => false,
                        'sort'        => 9,
                    ],
                    [
                        'name'        => 'Mexican Coffee "Café de Olla"',
                        'name_es'     => 'Café de Olla',
                        'price'       => 6.00,
                        'description' => 'Traditional cinnamon and piloncillo notes brewed into a warm, spiced espresso drink.',
                        'featured'    => false,
                        'sort'        => 10,
                    ],
                    [
                        'name'        => 'Chocolate Abuelita Latte',
                        'name_es'     => 'Latte de Chocolate Abuelita',
                        'price'       => 6.00,
                        'description' => 'Abuelita chocolate powder with a pinch of salt, dash of cinnamon, espresso, and steamed milk.',
                        'featured'    => false,
                        'sort'        => 11,
                    ],
                    [
                        'name'        => 'Cookie Butter Latte',
                        'name_es'     => 'Latte de Mantequilla de Galleta',
                        'price'       => 6.00,
                        'description' => 'Cookie butter melted with espresso and vanilla syrup, topped with crumbled cookie.',
                        'featured'    => false,
                        'sort'        => 12,
                    ],
                    [
                        'name'        => 'Honey Vanilla Latte',
                        'name_es'     => 'Latte de Miel y Vainilla',
                        'price'       => 6.00,
                        'description' => 'Honey and vanilla pulled with espresso and steamed milk, finished with a sprinkle of sea salt.',
                        'featured'    => false,
                        'sort'        => 13,
                    ],
                    [
                        'name'        => 'Cappuccino',
                        'name_es'     => 'Cappuccino',
                        'price'       => 4.75,
                        'description' => 'Equal parts espresso, steamed milk, and thick velvety foam. A timeless classic.',
                        'featured'    => false,
                        'sort'        => 14,
                    ],
                    [
                        'name'        => 'Americano',
                        'name_es'     => 'Americano',
                        'price'       => 3.00,
                        'description' => 'Two shots of espresso lengthened with hot water. Clean, bold, and satisfying.',
                        'featured'    => false,
                        'sort'        => 15,
                    ],
                ],
            ],
            [
                'name'        => 'Lemonade',
                'description' => 'Hand-crafted lemonades made with real fruit and house syrups.',
                'sort_order'  => 2,
                'items'       => [
                    [
                        'name'        => 'Blueberry Lemonade (Small 12 oz)',
                        'name_es'     => 'Limonada de Arándano (Chica 12 oz)',
                        'price'       => 3.00,
                        'description' => 'Fresh lemonade with house blueberry syrup. Bright, fruity, and refreshing.',
                        'featured'    => false,
                        'sort'        => 1,
                    ],
                    [
                        'name'        => 'Blueberry Lemonade (Large 24 oz)',
                        'name_es'     => 'Limonada de Arándano (Grande 24 oz)',
                        'price'       => 6.00,
                        'description' => 'Fresh lemonade with house blueberry syrup. Bright, fruity, and refreshing.',
                        'featured'    => true,
                        'sort'        => 2,
                    ],
                    [
                        'name'        => 'Strawberry Lemonade (Small 12 oz)',
                        'name_es'     => 'Limonada de Fresa (Chica 12 oz)',
                        'price'       => 3.00,
                        'description' => 'Sweet strawberry purée blended with fresh-squeezed lemonade. Summer in a cup.',
                        'featured'    => false,
                        'sort'        => 3,
                    ],
                    [
                        'name'        => 'Strawberry Lemonade (Large 24 oz)',
                        'name_es'     => 'Limonada de Fresa (Grande 24 oz)',
                        'price'       => 6.00,
                        'description' => 'Sweet strawberry purée blended with fresh-squeezed lemonade. Summer in a cup.',
                        'featured'    => false,
                        'sort'        => 4,
                    ],
                ],
            ],
            [
                'name'        => 'Matcha',
                'description' => 'Premium ceremonial-grade matcha, available hot or iced.',
                'sort_order'  => 3,
                'items'       => [
                    [
                        'name'        => 'Blueberry Matcha (Small 12 oz)',
                        'name_es'     => 'Matcha de Arándano (Chica 12 oz)',
                        'price'       => 6.50,
                        'description' => 'Ceremonial matcha with blueberry sauce and vanilla, whisked with steamed milk.',
                        'featured'    => true,
                        'sort'        => 1,
                    ],
                    [
                        'name'        => 'Blueberry Matcha (Large 16 oz)',
                        'name_es'     => 'Matcha de Arándano (Grande 16 oz)',
                        'price'       => 7.50,
                        'description' => 'Ceremonial matcha with blueberry sauce and vanilla, whisked with steamed milk.',
                        'featured'    => false,
                        'sort'        => 2,
                    ],
                    [
                        'name'        => 'Strawberry Matcha (Small 12 oz)',
                        'name_es'     => 'Matcha de Fresa (Chica 12 oz)',
                        'price'       => 6.50,
                        'description' => 'Vibrant ceremonial matcha with house strawberry sauce and creamy steamed milk.',
                        'featured'    => false,
                        'sort'        => 3,
                    ],
                    [
                        'name'        => 'Strawberry Matcha (Large 16 oz)',
                        'name_es'     => 'Matcha de Fresa (Grande 16 oz)',
                        'price'       => 7.50,
                        'description' => 'Vibrant ceremonial matcha with house strawberry sauce and creamy steamed milk.',
                        'featured'    => false,
                        'sort'        => 4,
                    ],
                ],
            ],
            [
                'name'        => 'Seasonal Drinks',
                'description' => 'Rotating specials that follow what\'s fresh — available for a limited time.',
                'sort_order'  => 4,
                'items'       => [
                    [
                        'name'        => 'Fresas con Crema Matcha',
                        'name_es'     => 'Matcha de Fresas con Crema',
                        'price'       => 7.00,
                        'description' => 'Creamy strawberries-and-cream blended with ceremonial matcha. Sweet, vibrant, and indulgent.',
                        'featured'    => true,
                        'sort'        => 1,
                    ],
                    [
                        'name'        => 'Horchata Matcha',
                        'name_es'     => 'Matcha de Horchata',
                        'price'       => 7.00,
                        'description' => 'Traditional horchata meets ceremonial matcha — cinnamon-rice sweetness with earthy green tea.',
                        'featured'    => false,
                        'sort'        => 2,
                    ],
                    [
                        'name'        => 'Peppermint Mocha Latte',
                        'name_es'     => 'Latte de Moca y Menta',
                        'price'       => 6.50,
                        'description' => 'Mocha sauce and peppermint syrup with espresso and steamed milk, topped with crushed peppermint.',
                        'featured'    => false,
                        'sort'        => 3,
                    ],
                    [
                        'name'        => 'Hot Chocolate',
                        'name_es'     => 'Chocolate Caliente',
                        'price'       => 5.00,
                        'description' => 'Rich hot chocolate with peppermint syrup and steamed milk, topped with marshmallows, crushed peppermint, and mocha drizzle.',
                        'featured'    => false,
                        'sort'        => 4,
                    ],
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
                    'name_es'          => $item['name_es'],
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
