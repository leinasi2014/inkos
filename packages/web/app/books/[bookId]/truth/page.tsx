import { TruthPage } from "../../../../components/books/truth-page";

export default async function TruthRoute({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  return <TruthPage bookId={bookId} />;
}
