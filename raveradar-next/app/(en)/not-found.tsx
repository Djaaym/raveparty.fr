import NotFoundPage from "@/components/NotFoundPage";

/** Same 404 as the French tree, see app/(fr)/not-found.tsx for why it lives per group. */
export default function NotFound() {
  return <NotFoundPage lang="en" />;
}
