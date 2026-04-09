import { getMovieDetail } from "@/services/api";
import { getMovieDetailFromCache } from "@/lib/movie-cache";
import { redirect, notFound } from "next/navigation";

// Cache redirects for 5 min — episodes don't change often
export const revalidate = 300;

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function WatchRedirectPage({ params }: PageProps) {
    const { slug } = await params;

    // Try cache first, fall back to external API
    const data = (await getMovieDetailFromCache(slug)) ?? (await getMovieDetail(slug));

    if (!data?.movie) {
        return notFound();
    }

    // Attempt to find the first episode
    const firstEpisode = data.episodes?.[0]?.server_data?.[0];

    if (firstEpisode && firstEpisode.slug) {
        // Redirect to the first episode
        redirect(`/xem-phim/${slug}/${firstEpisode.slug}`);
    } else {
        // Fallback to detail page if no episodes found
        redirect(`/phim/${slug}`);
    }
}
