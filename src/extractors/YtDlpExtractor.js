import { BaseExtractor, QueryType, Track } from 'discord-player';
import { execSync } from 'child_process';
import pkg from 'yt-dlp-wrap';
const { default: YTDlpWrap } = pkg;

/**
 * Find yt-dlp binary path across platforms (macOS, Linux, Windows)
 */
function findYtDlpPath() {
    // Check common locations in order of priority
    const candidates = [
        process.env.YTDLP_PATH,            // User-specified via env var
        '/usr/local/bin/yt-dlp',            // Linux / macOS (manual install)
        '/usr/bin/yt-dlp',                  // Linux (package manager)
        '/opt/homebrew/bin/yt-dlp',         // macOS (Homebrew ARM)
        '/usr/local/Cellar/yt-dlp',         // macOS (Homebrew Intel)
    ].filter(Boolean);

    for (const path of candidates) {
        try {
            execSync(`"${path}" --version`, { stdio: 'ignore' });
            return path;
        } catch {
            // Not found at this path, try next
        }
    }

    // Fallback: rely on system PATH (works on all platforms including Windows)
    try {
        execSync('yt-dlp --version', { stdio: 'ignore' });
        return 'yt-dlp';
    } catch {
        throw new Error(
            'yt-dlp not found. Install it:\n' +
            '  Windows: winget install yt-dlp  (or download from github.com/yt-dlp/yt-dlp)\n' +
            '  macOS:   brew install yt-dlp\n' +
            '  Linux:   sudo apt install yt-dlp  (or pip install yt-dlp)\n' +
            '  Or set YTDLP_PATH environment variable to the yt-dlp binary path.'
        );
    }
}

export class YtDlpExtractor extends BaseExtractor {
    static identifier = 'com.discord-player.ytdlpextractor';

    constructor(context, options) {
        super(context, options);
        const ytDlpPath = findYtDlpPath();
        console.log(`[YtDlp] Using binary: ${ytDlpPath}`);
        this.ytDlp = new YTDlpWrap(ytDlpPath);
    }

    async activate() {
        try {
            const version = await this.ytDlp.getVersion();
            console.log('[YtDlp] Using yt-dlp version:', version);
        } catch (error) {
            console.error('[YtDlp] Failed to initialize yt-dlp:', error);
            throw error;
        }
    }

    async validate(query, type) {
        try {
            // For AUTO queries (which is what we get for search), always try YouTube
            if (type === QueryType.AUTO_SEARCH || type === 'autoSearch') {
                return true;
            }

            // Check if the query is a YouTube URL or search query
            if (type === QueryType.YOUTUBE_SEARCH) return true;
            if (type === QueryType.YOUTUBE_VIDEO) return true;
            if (type === QueryType.YOUTUBE_PLAYLIST) return true;

            // Check if it's a YouTube URL
            const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
            return ytRegex.test(query);
        } catch (error) {
            console.error('[YtDlp] Validation error:', error);
            return false;
        }
    }

    /**
     * Check if a URL is a YouTube playlist URL
     */
    isPlaylistUrl(query) {
        if (!query.startsWith('http')) return false;
        // Match YouTube playlist URLs:
        // - youtube.com/playlist?list=PLxxxx
        // - youtube.com/watch?v=xxx&list=PLxxxx
        // - youtu.be/xxx?list=PLxxxx
        const playlistRegex = /(?:youtube\.com\/(?:playlist\?|watch\?.*&?)list=|youtu\.be\/[^?]+\?.*list=)([a-zA-Z0-9_-]+)/;
        return playlistRegex.test(query);
    }

    /**
     * Build a proper YouTube video URL from a video ID
     */
    buildVideoUrl(videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
    }

    /**
     * Build a thumbnail URL from a video ID (flat-playlist entries lack thumbnails)
     */
    buildThumbnailUrl(video) {
        if (video.thumbnail) return video.thumbnail;
        if (video.thumbnails?.[0]?.url) return video.thumbnails[0].url;
        if (video.id) return `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
        return null;
    }

    async handle(query, context) {
        try {
            console.log(`[YtDlp] Handling query: ${query}`);

            const isDirectUrl = query.startsWith('http');
            const isPlaylist = this.isPlaylistUrl(query);
            const searchQuery = isDirectUrl ? query : `ytsearch3:${query}`;

            console.log(`[YtDlp] isDirectUrl: ${isDirectUrl}, isPlaylist: ${isPlaylist}`);

            if (isPlaylist) {
                return await this.handlePlaylist(query, context);
            }

            // Use execPromise to get raw JSON output for better control
            const ytdlpArgs = [
                searchQuery,
                '--dump-json',
                '--no-playlist'
            ];

            const jsonOutput = await this.ytDlp.execPromise(ytdlpArgs);

            // Parse each line as JSON (yt-dlp outputs one JSON object per line)
            const lines = jsonOutput.trim().split('\n').filter(line => line.trim());
            const results = lines.map(line => JSON.parse(line));

            console.log(`[YtDlp] Raw results count: ${results.length}`);

            const maxResults = isDirectUrl ? 1 : 3;
            const limitedResults = results.slice(0, maxResults);

            const tracks = limitedResults.map(video => {
                return new Track(this.context.player, {
                    title: video.title,
                    author: video.uploader || video.channel || video.uploader_id || 'Unknown',
                    url: video.webpage_url || this.buildVideoUrl(video.id),
                    thumbnail: this.buildThumbnailUrl(video),
                    duration: this.parseDuration((video.duration || 0) * 1000),
                    views: video.view_count || 0,
                    requestedBy: context.requestedBy,
                    source: 'youtube',
                    engine: video,
                    queryType: isDirectUrl ? QueryType.YOUTUBE_VIDEO : QueryType.YOUTUBE_SEARCH
                });
            });

            console.log(`[YtDlp] Found ${tracks.length} track(s)`);
            return { tracks };
        } catch (error) {
            console.error('[YtDlp] Error handling query:', error);
            return { tracks: [] };
        }
    }

    /**
     * Handle YouTube playlist URLs separately for better reliability
     */
    async handlePlaylist(query, context) {
        try {
            console.log(`[YtDlp] Fetching playlist: ${query}`);

            // Use --flat-playlist for fast metadata extraction
            const ytdlpArgs = [
                query,
                '--dump-json',
                '--flat-playlist',
                '--yes-playlist'
            ];

            const jsonOutput = await this.ytDlp.execPromise(ytdlpArgs);

            const lines = jsonOutput.trim().split('\n').filter(line => line.trim());
            const results = lines.map(line => JSON.parse(line));

            if (results.length === 0) {
                console.log('[YtDlp] Playlist returned no results');
                return { tracks: [] };
            }

            // Extract playlist metadata from the first entry (flat-playlist includes it)
            const playlistTitle = results[0]?.playlist_title || 'YouTube Playlist';
            const playlistId = results[0]?.playlist_id || '';

            console.log(`[YtDlp] Playlist "${playlistTitle}" has ${results.length} tracks`);

            // Filter out entries without a valid video ID (e.g. deleted/private videos)
            const validResults = results.filter(video => video.id && video.title && video.title !== '[Deleted video]' && video.title !== '[Private video]');

            console.log(`[YtDlp] ${validResults.length} valid tracks after filtering`);

            const tracks = validResults.map(video => {
                return new Track(this.context.player, {
                    title: video.title,
                    author: video.uploader || video.channel || video.uploader_id || 'Unknown',
                    url: video.webpage_url || this.buildVideoUrl(video.id),
                    thumbnail: this.buildThumbnailUrl(video),
                    duration: this.parseDuration((video.duration || 0) * 1000),
                    views: video.view_count || 0,
                    requestedBy: context.requestedBy,
                    source: 'youtube',
                    engine: video,
                    queryType: QueryType.YOUTUBE_PLAYLIST
                });
            });

            return {
                playlist: {
                    title: playlistTitle,
                    url: playlistId ? `https://www.youtube.com/playlist?list=${playlistId}` : query,
                    thumbnail: this.buildThumbnailUrl(validResults[0]),
                    tracks: tracks.length
                },
                tracks
            };
        } catch (error) {
            console.error('[YtDlp] Error fetching playlist:', error);
            return { tracks: [] };
        }
    }

    async stream(track) {
        try {
            console.log(`[YtDlp] Getting stream for: ${track.title}`);
            console.log(`[YtDlp] Track URL: ${track.url}`);

            const url = track.url || track.raw?.url;

            if (!url) {
                throw new Error('No URL found in track object');
            }

            // Use yt-dlp with fallback format selector to handle SABR streaming
            // Format: bestaudio > best audio from any format > best available
            const streamUrl = await this.ytDlp.execPromise([
                url,
                '-f', 'bestaudio/ba/b',
                '-g', // Get direct URL
                '--no-playlist',
                '--extractor-args', 'youtube:player_client=android,web'
            ]);

            const directUrl = streamUrl.trim().split('\n')[0];
            console.log(`[YtDlp] Stream URL obtained`);

            // Return the direct URL as a string - discord-player will handle creating the stream
            return directUrl;
        } catch (error) {
            console.error('[YtDlp] Error getting stream:', error);
            throw error;
        }
    }

    parseDuration(durationMs) {
        const seconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        }
        return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
    }
}
