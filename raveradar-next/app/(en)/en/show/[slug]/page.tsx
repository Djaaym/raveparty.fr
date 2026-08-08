import { permanentRedirect } from "next/navigation";
import { showRedirect } from "@/lib/shows";

/** English twin of the FR route: a 301 forwarder, not a page. See `lib/shows.ts`. */
export const dynamic = "force-dynamic";

export default function Page({ params }: { params: { slug: string } }) {
  permanentRedirect(`/en${showRedirect(params.slug)}`);
}
