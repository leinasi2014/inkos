import { MaterialsPage } from "../../../../components/materials/materials-page";

export default async function MaterialsRoute({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  return <MaterialsPage bookId={bookId} />;
}
