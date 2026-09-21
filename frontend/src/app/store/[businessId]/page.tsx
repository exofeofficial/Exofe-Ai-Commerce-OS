import StorefrontPage from "@/views/StorefrontPage";

export default async function Page({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return <StorefrontPage businessId={businessId} />;
}
