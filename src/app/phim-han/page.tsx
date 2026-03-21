import CountryPage, { generateMetadata as baseGenerateMetadata } from "../quoc-gia/[slug]/page";

export async function generateMetadata() {
    return baseGenerateMetadata({ params: Promise.resolve({ slug: "han-quoc" }) });
}

export default function PhimHanPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    return <CountryPage params={Promise.resolve({ slug: "han-quoc" })} searchParams={searchParams} />;
}
