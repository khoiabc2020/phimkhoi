import VideoPlayer from "@/components/VideoPlayer";

export default function TestVideoPage() {
    // Test with actual m3u8 URL from API
    const testUrl = "https://player.phimapi.com/player/?url=https://s6.kkphimplayer6.com/20260214/Sk6N5ory/index.m3u8";
    const testM3u8 = "https://s6.kkphimplayer6.com/20260214/Sk6N5ory/index.m3u8";

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-12">
            <div className="container mx-auto px-4 md:px-8">
                <h1 className="text-3xl font-bold text-white mb-6">Video Player Test</h1>

                <div className="mb-8">
                    <h2 className="text-xl text-white mb-2">Test 1: HLS with m3u8 URL</h2>
                    <p className="text-gray-400 text-sm mb-4">Should use HTML5 video + HLS.js with custom controls</p>
                    <VideoPlayer
                        url={testUrl}
                        m3u8={testM3u8}
                        slug="test"
                        episode="1"
                    />
                </div>

                <div className="mb-8">
                    <h2 className="text-xl text-white mb-2">Test 2: Iframe fallback (no m3u8)</h2>
                    <p className="text-gray-400 text-sm mb-4">Should use iframe player</p>
                    <VideoPlayer
                        url={testUrl}
                        slug="test"
                        episode="2"
                    />
                </div>

                <div className="bg-black/50 border border-white/10 rounded-xl p-6 mt-8">
                    <h3 className="text-white font-bold mb-4">Debug Info:</h3>
                    <div className="space-y-2 text-sm">
                        <p className="text-gray-300">
                            <span className="text-yellow-500">Iframe URL:</span> {testUrl}
                        </p>
                        <p className="text-gray-300">
                            <span className="text-yellow-500">M3U8 URL:</span> {testM3u8}
                        </p>
                        <p className="text-gray-400 mt-4">
                            Open browser console (F12) to see detailed HLS logs
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
