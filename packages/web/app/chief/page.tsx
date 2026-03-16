import { ChiefPage } from "../../components/chief/chief-page";

export default async function ChiefRoute({
  searchParams,
}: {
  searchParams: Promise<{ threadId?: string }>;
}) {
  const params = await searchParams;
  return <ChiefPage initialThreadId={params.threadId} />;
}
