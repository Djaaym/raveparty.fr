import { ExplorePage } from "@/app/explore/page";

type SP = { [k: string]: string | string[] | undefined };

export default function Page({ searchParams }: { searchParams: SP }) {
  return <ExplorePage lang="en" searchParams={searchParams} />;
}
