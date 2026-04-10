import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * On-demand ISR revalidation.
 * Called by admin pages after saving content so public pages reflect changes immediately.
 *
 * POST /api/revalidate { paths: ["/", "/about", "/menu"] }
 */
export async function POST(request: NextRequest) {
  try {
    const { paths } = await request.json();
    if (!Array.isArray(paths)) {
      return NextResponse.json({ message: "paths must be an array" }, { status: 400 });
    }
    for (const p of paths) {
      if (typeof p === "string") revalidatePath(p);
    }
    return NextResponse.json({ revalidated: true, paths });
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
