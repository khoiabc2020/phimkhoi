import { getMovieDetail } from "@/services/api";
import { redirect, notFound } from "next/navigation";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function WatchRedirectPage({ params }: PageProps) {
    const { slug } = await params;

    // Fetch movie details to find the first episode
    const data = await getMovieDetail(slug);

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
