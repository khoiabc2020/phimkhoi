import CountryPage, { generateMetadata as baseGenerateMetadata } from "../quoc-gia/[slug]/page";

export async function generateMetadata() {
    return baseGenerateMetadata({ params: Promise.resolve({ slug: "trung-quoc" }) });
}

export default function PhimTrungPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    return <CountryPage params={Promise.resolve({ slug: "trung-quoc" })} searchParams={searchParams} />;
}
