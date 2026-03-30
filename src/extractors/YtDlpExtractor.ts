import { execSync } from 'child_process'
import { PassThrough } from 'stream'

import {
  BaseExtractor,
  QueryType,
  Track,
  type ExtractorExecutionContext,
  type ExtractorInfo,
  type ExtractorSearchContext,
  type ExtractorStreamable,
  type SearchQueryType,
} from 'discord-player'
import YTDlpWrapImport from 'yt-dlp-wrap'

const YTDlpWrap = YTDlpWrapImport as unknown as typeof import('yt-dlp-wrap').default
type YTDlpWrapInstance = InstanceType<typeof YTDlpWrap>

interface YtDlpThumbnail {
  url?: string
}

interface YtDlpVideo {
  id?: string
  title?: string
  uploader?: string
  channel?: string
  uploader_id?: string
  webpage_url?: string
  thumbnail?: string
  thumbnails?: YtDlpThumbnail[]
  duration?: number
  view_count?: number
  playlist_title?: string
  playlist_id?: string
}

/**
 * Find yt-dlp binary path across platforms (macOS, Linux, Windows)
 */
function findYtDlpPath(): string {
  // Check common locations in order of priority
  const candidates = [
    process.env.YTDLP_PATH, // User-specified via env var
    '/usr/local/bin/yt-dlp', // Linux / macOS (manual install)
    '/usr/bin/yt-dlp', // Linux (package manager)
    '/opt/homebrew/bin/yt-dlp', // macOS (Homebrew ARM)
    '/usr/local/Cellar/yt-dlp', // macOS (Homebrew Intel)
  ].filter((candidate): candidate is string => Boolean(candidate))

  for (const path of candidates) {
    try {
      execSync(`"${path}" --version`, { stdio: 'ignore' })
      return path
    } catch {
      // Not found at this path, try next
    }
  }

  // Fallback: rely on system PATH (works on all platforms including Windows)
  try {
    execSync('yt-dlp --version', { stdio: 'ignore' })
    return 'yt-dlp'
  } catch {
    throw new Error(
      'yt-dlp not found. Install it:\n' +
        '  Windows: winget install yt-dlp  (or download from github.com/yt-dlp/yt-dlp)\n' +
        '  macOS:   brew install yt-dlp\n' +
        '  Linux:   sudo apt install yt-dlp  (or pip install yt-dlp)\n' +
        '  Or set YTDLP_PATH environment variable to the yt-dlp binary path.',
    )
  }
}

export class YtDlpExtractor extends BaseExtractor<object> {
  static identifier = 'com.discord-player.ytdlpextractor'

  private ytDlp: YTDlpWrapInstance

  constructor(context: ExtractorExecutionContext, options?: object) {
    super(context, options)
    const ytDlpPath = findYtDlpPath()
    console.log(`[YtDlp] Using binary: ${ytDlpPath}`)
    this.ytDlp = new YTDlpWrap(ytDlpPath)
  }

  async activate(): Promise<void> {
    try {
      const version = await this.ytDlp.getVersion()
      console.log('[YtDlp] Using yt-dlp version:', version)
      const cookieArgs = this.getCookieArgs()
      if (cookieArgs.length > 0) {
        console.log(`[YtDlp] Cookie source: ${cookieArgs.join(' ')}`)
      } else {
        console.warn(
          '[YtDlp] No cookies configured — YouTube may block requests. Set YTDLP_COOKIES_FILE or YTDLP_COOKIES_BROWSER env var.',
        )
      }
    } catch (error) {
      console.error('[YtDlp] Failed to initialize yt-dlp:', error)
      throw error
    }
  }

  /**
   * Returns yt-dlp args for cookie authentication.
   * Set YTDLP_COOKIES_FILE=/path/to/cookies.txt  (exported from browser extension)
   * Or YTDLP_COOKIES_BROWSER=chrome|safari|firefox  (reads live browser session)
   */
  getCookieArgs(): string[] {
    if (process.env.YTDLP_COOKIES_FILE) {
      return ['--cookies', process.env.YTDLP_COOKIES_FILE]
    }
    if (process.env.YTDLP_COOKIES_BROWSER) {
      return ['--cookies-from-browser', process.env.YTDLP_COOKIES_BROWSER]
    }
    return []
  }

  async validate(query: string, type?: SearchQueryType | null): Promise<boolean> {
    try {
      // For AUTO queries (which is what we get for search), always try YouTube
      if (type === QueryType.AUTO_SEARCH || (type as string | undefined) === 'autoSearch') {
        return true
      }

      // Check if the query is a YouTube URL or search query
      if (type === QueryType.YOUTUBE_SEARCH) return true
      if (type === QueryType.YOUTUBE_VIDEO) return true
      if (type === QueryType.YOUTUBE_PLAYLIST) return true

      // Check if it's a YouTube URL
      const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
      return ytRegex.test(query)
    } catch (error) {
      console.error('[YtDlp] Validation error:', error)
      return false
    }
  }

  /**
   * Check if a URL is a YouTube playlist URL
   */
  isPlaylistUrl(query: string): boolean {
    if (!query.startsWith('http')) return false
    // Match YouTube playlist URLs:
    // - youtube.com/playlist?list=PLxxxx
    // - youtube.com/watch?v=xxx&list=PLxxxx
    // - youtu.be/xxx?list=PLxxxx
    const playlistRegex =
      /(?:youtube\.com\/(?:playlist\?|watch\?.*&?)list=|youtu\.be\/[^?]+\?.*list=)([a-zA-Z0-9_-]+)/
    return playlistRegex.test(query)
  }

  /**
   * Build a proper YouTube video URL from a video ID
   */
  buildVideoUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`
  }

  /**
   * Build a thumbnail URL from a video ID (flat-playlist entries lack thumbnails)
   */
  buildThumbnailUrl(video: YtDlpVideo): string | null {
    if (video.thumbnail) return video.thumbnail
    if (video.thumbnails?.[0]?.url) return video.thumbnails[0].url
    if (video.id) return `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`
    return null
  }

  async handle(query: string, context: ExtractorSearchContext): Promise<ExtractorInfo> {
    try {
      console.log(`[YtDlp] Handling query: ${query}`)

      const isDirectUrl = query.startsWith('http')
      const isPlaylist = this.isPlaylistUrl(query)
      const searchQuery = isDirectUrl ? query : `ytsearch3:${query}`

      console.log(`[YtDlp] isDirectUrl: ${isDirectUrl}, isPlaylist: ${isPlaylist}`)

      if (isPlaylist) {
        return await this.handlePlaylist(query, context)
      }

      // Use execPromise to get raw JSON output for better control
      const ytdlpArgs = [
        searchQuery,
        '--dump-json',
        '--no-playlist',
        '--extractor-args',
        'youtube:player_client=android_music,ios,mweb,web',
        '--no-warnings',
        ...this.getCookieArgs(),
      ]

      const jsonOutput = await this.ytDlp.execPromise(ytdlpArgs)

      // Parse each line as JSON (yt-dlp outputs one JSON object per line)
      const lines = jsonOutput
        .trim()
        .split('\n')
        .filter((line: string) => line.trim())
      const results = lines.map((line: string) => JSON.parse(line) as YtDlpVideo)

      console.log(`[YtDlp] Raw results count: ${results.length}`)

      const maxResults = isDirectUrl ? 1 : 3
      const limitedResults = results.slice(0, maxResults)

      const tracks = limitedResults.map((video: YtDlpVideo) => {
        const videoId = video.id ?? ''

        return new Track(this.context.player, {
          title: video.title ?? 'Unknown',
          author: video.uploader || video.channel || video.uploader_id || 'Unknown',
          url: video.webpage_url || this.buildVideoUrl(videoId),
          thumbnail: this.buildThumbnailUrl(video) ?? undefined,
          duration: this.parseDuration((video.duration || 0) * 1000),
          views: video.view_count || 0,
          requestedBy: context.requestedBy,
          source: 'youtube',
          engine: video,
          queryType: isDirectUrl ? QueryType.YOUTUBE_VIDEO : QueryType.YOUTUBE_SEARCH,
        })
      })

      console.log(`[YtDlp] Found ${tracks.length} track(s)`)
      return { playlist: null, tracks }
    } catch (error) {
      console.error('[YtDlp] Error handling query:', error)
      return { playlist: null, tracks: [] }
    }
  }

  /**
   * Handle YouTube playlist URLs separately for better reliability
   */
  async handlePlaylist(query: string, context: ExtractorSearchContext): Promise<ExtractorInfo> {
    try {
      console.log(`[YtDlp] Fetching playlist: ${query}`)

      // Use --flat-playlist for fast metadata extraction
      const ytdlpArgs = [
        query,
        '--dump-json',
        '--flat-playlist',
        '--yes-playlist',
        '--extractor-args',
        'youtube:player_client=android_music,ios,mweb,web',
        '--no-warnings',
        ...this.getCookieArgs(),
      ]

      const jsonOutput = await this.ytDlp.execPromise(ytdlpArgs)

      const lines = jsonOutput
        .trim()
        .split('\n')
        .filter((line: string) => line.trim())
      const results = lines.map((line: string) => JSON.parse(line) as YtDlpVideo)

      if (results.length === 0) {
        console.log('[YtDlp] Playlist returned no results')
        return { playlist: null, tracks: [] }
      }

      // Extract playlist metadata from the first entry (flat-playlist includes it)
      const playlistTitle = results[0]?.playlist_title || 'YouTube Playlist'
      const playlistId = results[0]?.playlist_id || ''

      console.log(`[YtDlp] Playlist "${playlistTitle}" has ${results.length} tracks`)

      // Filter out entries without a valid video ID (e.g. deleted/private videos)
      const validResults = results.filter(
        (video: YtDlpVideo) =>
          video.id && video.title && video.title !== '[Deleted video]' && video.title !== '[Private video]',
      )

      console.log(`[YtDlp] ${validResults.length} valid tracks after filtering`)

      const tracks = validResults.map((video: YtDlpVideo) => {
        const videoId = video.id as string

        return new Track(this.context.player, {
          title: video.title as string,
          author: video.uploader || video.channel || video.uploader_id || 'Unknown',
          url: video.webpage_url || this.buildVideoUrl(videoId),
          thumbnail: this.buildThumbnailUrl(video) ?? undefined,
          duration: this.parseDuration((video.duration || 0) * 1000),
          views: video.view_count || 0,
          requestedBy: context.requestedBy,
          source: 'youtube',
          engine: video,
          queryType: QueryType.YOUTUBE_PLAYLIST,
        })
      })

      return {
        playlist: {
          title: playlistTitle,
          url: playlistId ? `https://www.youtube.com/playlist?list=${playlistId}` : query,
          thumbnail: this.buildThumbnailUrl(validResults[0] ?? {}),
          tracks: tracks.length,
        } as unknown as ExtractorInfo['playlist'],
        tracks,
      }
    } catch (error) {
      console.error('[YtDlp] Error fetching playlist:', error)
      return { playlist: null, tracks: [] }
    }
  }

  async stream(track: Track): Promise<ExtractorStreamable> {
    try {
      console.log(`[YtDlp] Getting stream for: ${track.title}`)
      console.log(`[YtDlp] Track URL: ${track.url}`)

      const raw = track.raw as { url?: string } | undefined
      const url = track.url || raw?.url

      if (!url) {
        throw new Error('No URL found in track object')
      }

      // Pipe audio through yt-dlp process. Direct URLs don't work because
      // YouTube requires auth headers that FFmpeg doesn't send.
      // Use PassThrough to buffer the data so the stream stays open
      // while the audio player consumes it at playback speed.
      console.log('[YtDlp] Starting yt-dlp audio pipe...')

      const passThrough = new PassThrough({
        highWaterMark: 1 << 25, // 32MB buffer
      })

      const ytdlpStream = this.ytDlp.execStream([
        url,
        '-f',
        'bestaudio*[ext=webm]/bestaudio*/best',
        '-o',
        '-',
        '--no-playlist',
        '--extractor-args',
        'youtube:player_client=android_music,ios,mweb,web',
        '--no-warnings',
        ...this.getCookieArgs(),
      ])

      let chunkCount = 0
      let totalBytes = 0

      ytdlpStream.on('data', (chunk: Buffer) => {
        const buffer = chunk as Buffer
        chunkCount++
        totalBytes += buffer.length
        if (chunkCount <= 3 || chunkCount % 200 === 0) {
          console.log(
            `[YtDlp Stream] Chunk #${chunkCount}: ${buffer.length} bytes (total: ${totalBytes})`,
          )
        }
      })

      ytdlpStream.on('end', () => {
        console.log(`[YtDlp Stream] Download complete (${chunkCount} chunks, ${totalBytes} bytes)`)
      })

      ytdlpStream.on('error', (error: Error) => {
        console.error('[YtDlp Stream] Error:', error.message)
        passThrough.destroy(error)
      })

      passThrough.on('close', () => {
        console.log('[YtDlp Stream] PassThrough closed')
      })

      ytdlpStream.pipe(passThrough)

      console.log('[YtDlp] Returning buffered stream')
      return passThrough
    } catch (error) {
      console.error('[YtDlp] Error getting stream:', error)
      throw error
    }
  }

  parseDuration(durationMs: number): string {
    const seconds = Math.floor(durationMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
  }
}
