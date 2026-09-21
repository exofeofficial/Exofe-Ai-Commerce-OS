import ThemeDetailPage from "@/views/ThemeDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ThemeDetailPage id={id} />;
}
