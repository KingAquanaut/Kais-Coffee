<?php

namespace App\Console\Commands;

use App\Models\MenuItem;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Consolidate duplicate menu items that differ only by size into size variants.
 *
 * Detects items in the same category whose normalized names match (e.g. ignoring
 * "(Small 12 oz)" / "(Large 24 oz)" suffixes), merges them onto the lowest-price
 * row as variants, and marks the higher-price duplicates as inactive (NOT
 * deleted) so the data is recoverable.
 *
 * Run:  php artisan menu:consolidate-sizes              (dry-run)
 *       php artisan menu:consolidate-sizes --apply      (actually persist)
 *
 * Always shows what will change before persisting.
 */
class ConsolidateMenuSizes extends Command
{
    protected $signature = 'menu:consolidate-sizes
                            {--apply : Persist the consolidation. Without this flag the command only previews the plan.}';

    protected $description = 'Merge duplicate menu items that differ only by size into size variants on the canonical (lowest-price) item.';

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');

        $items = MenuItem::orderBy('menu_category_id')->orderBy('price')->get();

        // Group by (category, normalized base name)
        $groups = $items->groupBy(function (MenuItem $i) {
            return $i->menu_category_id . '::' . $this->normalizeName($i->name);
        });

        $plan = [];
        foreach ($groups as $key => $group) {
            if ($group->count() < 2) continue;

            // Canonical = lowest price; others become variants on it
            $sorted = $group->sortBy('price')->values();
            /** @var MenuItem $canonical */
            $canonical = $sorted->first();
            $duplicates = $sorted->slice(1);

            $plan[] = [
                'canonical'  => $canonical,
                'duplicates' => $duplicates,
            ];
        }

        if (count($plan) === 0) {
            $this->info('No duplicate sized items detected. Nothing to consolidate.');
            return self::SUCCESS;
        }

        $this->info(($apply ? 'APPLYING ' : 'DRY RUN — preview only ') . 'consolidation plan:');
        $this->newLine();

        foreach ($plan as $p) {
            $canonical = $p['canonical'];
            $this->line("• Category #{$canonical->menu_category_id} — base: \"{$this->normalizeName($canonical->name)}\"");
            $this->line(sprintf(
                '  KEEP id=%d  "%s"  $%s',
                $canonical->id, $canonical->name, $canonical->price,
            ));
            foreach ($p['duplicates'] as $dup) {
                /** @var MenuItem $dup */
                $size = $this->extractSize($dup->name) ?? $this->extractSize($canonical->name) ?? 'Large';
                $this->line(sprintf(
                    '    + variant from id=%d  "%s"  size=%s  $%s  (will be marked inactive)',
                    $dup->id, $dup->name, $size, $dup->price,
                ));
            }
        }

        if (! $apply) {
            $this->newLine();
            $this->comment('Re-run with --apply to persist these changes.');
            return self::SUCCESS;
        }

        $this->newLine();
        if (! $this->confirm('Apply the plan above?', false)) {
            $this->warn('Aborted.');
            return self::SUCCESS;
        }

        foreach ($plan as $p) {
            /** @var MenuItem $canonical */
            $canonical = $p['canonical'];

            // First variant = canonical's own size (so the menu always has a small option)
            $smallSize = $this->extractSize($canonical->name) ?? 'Small';
            $canonical->variants()->updateOrCreate(
                ['size_label' => $smallSize],
                ['price' => $canonical->price, 'sort_order' => 0, 'is_active' => true],
            );

            $sort = 1;
            foreach ($p['duplicates'] as $dup) {
                /** @var MenuItem $dup */
                $size = $this->extractSize($dup->name) ?? 'Large';
                $canonical->variants()->updateOrCreate(
                    ['size_label' => $size],
                    ['price' => $dup->price, 'sort_order' => $sort, 'is_active' => true],
                );
                $sort++;

                // Mark duplicate inactive — keep the row so the action is reversible
                $dup->update(['is_active' => false]);
            }

            // Strip "(Small 12 oz)" / "(Large 24 oz)" suffix from the canonical name
            $cleanName = $this->normalizeName($canonical->name);
            if ($cleanName !== $canonical->name && $cleanName !== '') {
                $canonical->update([
                    'name' => $cleanName,
                    'slug' => Str::slug($cleanName) . '-' . Str::random(4),
                ]);
            }
        }

        $this->info('Consolidation applied. Public menu will refresh on next request (or trigger ISR revalidation).');
        return self::SUCCESS;
    }

    /**
     * Strip parenthesized size hints from a name.
     * "Blueberry Lemonade (Small 12 oz)" → "Blueberry Lemonade".
     */
    private function normalizeName(string $name): string
    {
        return trim(preg_replace('/\s*\([^)]*\)\s*$/u', '', $name) ?? $name);
    }

    /**
     * Extract the size hint from a name like "Foo (Small 12 oz)" → "12 oz".
     */
    private function extractSize(string $name): ?string
    {
        if (preg_match('/\(([^)]+)\)\s*$/u', $name, $m)) {
            $inner = trim($m[1]);
            // Pull the "12 oz" / "16 oz" / "24 oz" portion if present
            if (preg_match('/(\d+\s*oz)/iu', $inner, $om)) {
                return strtolower(trim($om[1]));
            }
            return $inner;
        }
        return null;
    }
}
