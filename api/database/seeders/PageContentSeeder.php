<?php

namespace Database\Seeders;

use App\Models\PageContent;
use Illuminate\Database\Seeder;

class PageContentSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            // Hero
            'hero_heading'       => "More than a cup of coffee.",
            'hero_subtext'       => "We believe every visit should feel like a small, quiet pleasure — crafted just for you.",
            'hero_image_url'     => null,

            // Our Story
            'story_heading'      => "Where it all began.",
            'story_body'         => "Kai's Coffee started with a single pour-over and a small corner table. What began as a passion project grew into a neighbourhood ritual — a place where regulars are greeted by name and every espresso is pulled with intention. We source single-origin beans from small, ethical farms and roast them to bring out the best of what the land has to offer.\n\nOur goal has always been simple: make something worth coming back for, every single day.",

            // Our Coffee
            'coffee_heading'     => "Sourced with care, made with precision.",
            'coffee_card_1_title'=> "Espresso",
            'coffee_card_1_body' => "Single-origin beans, dialled in daily. Dark chocolate and hazelnut notes with a clean, bright finish.",
            'coffee_card_2_title'=> "Cold Brew",
            'coffee_card_2_body' => "18-hour cold steep. Nitrogen on tap. Smooth, never bitter — perfect for warm afternoons.",
            'coffee_card_3_title'=> "Seasonal Drinks",
            'coffee_card_3_body' => "Rotating specials that follow what's fresh: honey lavender lattes, spiced autumn blends, and more.",

            // Meet the Team
            'team_heading'          => "The people behind your cup.",
            'team_subtext'          => "Our baristas are trained extensively — not just in technique, but in hospitality. They remember your order, your name, and whether you take oat milk. They make Kai's what it is.",
            'team_member_1_name'    => "Kai",
            'team_member_1_role'    => "Founder & Head Barista",
            'team_member_2_name'    => null,
            'team_member_2_role'    => null,
            'team_member_3_name'    => null,
            'team_member_3_role'    => null,

            // Where to Find Us
            'visit_heading'          => "Where to find us.",
            'location_address'       => "123 Roastery Lane\nYour City, ST 00000",
            'location_hours_weekday' => "7 am – 6 pm",
            'location_hours_saturday'=> "8 am – 5 pm",
            'location_hours_sunday'  => "9 am – 3 pm",
            'location_map_embed'     => null,
        ];

        PageContent::setMany('about', $defaults);
    }
}
