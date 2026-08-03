import { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Download, Copy,
  Headphones, Calendar, Eye, Clock, Check, Heart, MessageSquare
} from 'lucide-react';
import { isItemLiked, toggleLikeItem } from '@/data/likesStore';
import type { Sermon } from '@/types';
import { cn } from '@/utils/cn';
import { api, resolveApiUrl } from '@/utils/api';

interface SermonPlayerProps {
  sermons: Sermon[];
  sermon: Sermon;
  onSermonSelect: (sermon: Sermon) => void;
}

export default function SermonPlayer({ sermons, sermon, onSermonSelect }: SermonPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState('');
  const [localViews, setLocalViews] = useState(sermon.views);
  const [localDownloads, setLocalDownloads] = useState(sermon.downloads || 0);
  const [isLiked, setIsLiked] = useState(() => isItemLiked('sermon', sermon.id));

  // Comments System State
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentName, setNewCommentName] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const COMMENTS_PER_PAGE = 5;

  useEffect(() => {
    setIsLiked(isItemLiked('sermon', sermon.id));
    setLocalViews(sermon.views);
    setLocalDownloads(sermon.downloads || 0);
  }, [sermon.id, sermon.views, sermon.downloads]);

  useEffect(() => {
    const handleLikesUpdated = () => {
      setIsLiked(isItemLiked('sermon', sermon.id));
    };
    window.addEventListener('likes_updated', handleLikesUpdated);
    return () => window.removeEventListener('likes_updated', handleLikesUpdated);
  }, [sermon.id]);

  // Load comments and views on mount
  useEffect(() => {
    api.incrementSermonViews(sermon.id)
      .then((newViews) => {
        setLocalViews(newViews);
      })
      .catch((err) => console.error('Failed to increment views:', err));

    api.getComments('sermon', sermon.id)
      .then(data => { setComments(data); setCommentPage(1); })
      .catch(err => console.error('Failed to load comments:', err));
  }, [sermon.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentName.trim() || !newCommentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    setCommentSuccess(false);

    try {
      const res = await api.addComment('sermon', sermon.id, {
        name: newCommentName.trim(),
        text: newCommentText.trim(),
        itemTitle: sermon.title
      });

      setCommentSuccess(true);
      setNewCommentText('');

      if (res.comment && res.comment.status === 'approved') {
        setComments(prev => [res.comment, ...prev]);
        setCommentPage(1);
      } else {
        alert(res.message || 'Thank you! Your comment has been submitted and is awaiting moderation.');
      }
      setTimeout(() => setCommentSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to submit comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Series additions
  const rawAudios = Array.isArray(sermon.audios)
    ? sermon.audios
    : (typeof sermon.audios === 'string' ? JSON.parse(sermon.audios) : []);

  const tracks = (rawAudios && rawAudios.length > 0)
    ? rawAudios
    : [{ id: sermon.id, title: sermon.title || '', duration: sermon.duration || '', audioUrl: sermon.audioUrl || '' }];

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const activeTrack = tracks[currentTrackIndex] || tracks[0] || { id: sermon.id, title: sermon.title || '', duration: sermon.duration || '', audioUrl: sermon.audioUrl || '' };

  const formatTrackTitle = (title: string | undefined | null, showDownloadWord: boolean = false) => {
    if (!title) return '';
    let clean = title.trim();
    if (/^part\s+\d+/i.test(clean)) {
      const match = clean.match(/^part\s+(\d+)/i);
      if (match) {
        return showDownloadWord ? `Download Part ${match[1]}` : `Part ${match[1]}`;
      }
    }
    if (/^full\s+message/i.test(clean)) {
      return showDownloadWord ? "Download Full Message" : "Full Message";
    }
    return clean.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getDownloadFilename = (trackTitle: string | undefined | null) => {
    const cleanSermonTitle = (sermon.title || '')
      .replace(/\s+part\s+\d+\s+to\s+\d+.*/i, '')
      .replace(/\s+by\s+(Apostle|Pst|Pastor).*/i, '')
      .trim();
    
    let trackPart = (trackTitle || '').trim();
    if (/^part\s+\d+/i.test(trackPart)) {
      const match = trackPart.match(/^part\s+(\d+)/i);
      if (match) {
        trackPart = `Part_${match[1]}`;
      }
    } else {
      trackPart = trackPart.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_');
    }

    const sermonPart = cleanSermonTitle
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('_')
      .replace(/[^a-zA-Z0-9_]/g, '');

    let filename = '';
    if (sermonPart.toLowerCase().includes(trackPart.toLowerCase()) || trackPart.toLowerCase().includes(sermonPart.toLowerCase())) {
      filename = `${sermonPart}.mp3`;
    } else {
      filename = `${trackPart}_${sermonPart}.mp3`;
    }

    // Explicitly capitalize 'God'
    filename = filename.replace(/\bgod\b/gi, 'God');
    return filename;
  };

  const audioRef = useRef<HTMLAudioElement>(null);

  const activeMediaRef = audioRef;

  // Load saved notes from local storage
  useEffect(() => {
    const savedNotes = localStorage.getItem(`jgen_notes_${sermon.id}`);
    if (savedNotes) {
      setNotes(savedNotes);
    } else {
      setNotes('');
    }
    // Pause any media playing when sermon changes
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCurrentTrackIndex(0);
    
    // Sync views
    setLocalViews(sermon.views);
    setLocalDownloads(sermon.downloads || 0);
  }, [sermon.id, sermon.views]);

  // Trigger audio reload/play when track or sermon changes
  useEffect(() => {
    const media = audioRef.current;
    if (media) {
      media.load();
      if (isPlaying) {
        media.play().catch((err) => console.log('Playback failed:', err));
      }
    }
  }, [currentTrackIndex, activeTrack.audioUrl, sermon.id]);

  const handleDownloadIncrement = () => {
    api.incrementSermonDownloads(sermon.id)
      .then((newDownloads) => {
        setLocalDownloads(newDownloads);
      })
      .catch((err) => console.error('Failed to increment downloads:', err));
  };

  // Bulk download helper
  const downloadAllTracks = () => {
    if (!sermon.audios || sermon.audios.length === 0) return;
    handleDownloadIncrement();
    sermon.audios.forEach((track, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = resolveApiUrl(track.audioUrl);
        link.setAttribute('download', getDownloadFilename(track.title));
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 1000);
    });
  };

  // Handle note change and persist
  const handleNotesChange = (val: string) => {
    setNotes(val);
    localStorage.setItem(`jgen_notes_${sermon.id}`, val);
  };

  const togglePlay = () => {
    const media = activeMediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play().catch((err) => console.log('Playback failed:', err));
    }
    setIsPlaying((prev) => !prev);
  };

  // Media events
  const handleTimeUpdate = () => {
    const media = activeMediaRef.current;
    if (media) {
      setCurrentTime(media.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const media = activeMediaRef.current;
    if (media) {
      setDuration(media.duration || 0);
    }
  };

  const handleMediaEnd = () => {
    if (sermon.audios && sermon.audios.length > 0 && currentTrackIndex < sermon.audios.length - 1) {
      setCurrentTrackIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    const media = activeMediaRef.current;
    if (media) {
      media.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const media = activeMediaRef.current;
    if (media) {
      media.volume = val;
      media.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    const media = activeMediaRef.current;
    if (media) {
      const nextMute = !isMuted;
      media.muted = nextMute;
      setIsMuted(nextMute);
    }
  };

  // Download Notes
  const downloadNotes = () => {
    const element = document.createElement('a');
    const noteText = `SERMON NOTES: ${sermon.title}\nSpeaker: ${sermon.speaker}\nDate: ${sermon.date}\n\nNotes:\n${notes}`;
    const file = new Blob([noteText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${sermon.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Copy Link
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin + `/sermon/${sermon.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format Time Helper
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Related Sermons (Filter out current, recommend same category/speaker)
  const relatedSermons = sermons
    .filter((s) => s.id !== sermon.id && (s.audience || 'public') === (sermon.audience || 'public'))
    .slice(0, 4);

  return (
    <div className="pt-24 lg:pt-28 pb-20 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Audio Player & Notes (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Audio Player Container */}
            <div className="bg-gray-950 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative group flex flex-col justify-between" style={{ minHeight: '340px' }}>

              {/* Audio Element (hidden) */}
              <audio
                ref={audioRef}
                src={resolveApiUrl(activeTrack.audioUrl)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleMediaEnd}
              />

              {/* Audio Visual Display */}
              <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-royal-blue-950/20 to-gray-950 p-8 select-none relative overflow-hidden" style={{ minHeight: '260px' }}>

                {/* Background waveform bars */}
                <div className="absolute inset-0 opacity-10 flex items-center justify-around pointer-events-none px-8">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-1.5 rounded-full bg-royal-blue-400 transition-all duration-500',
                        isPlaying ? 'animate-pulse' : ''
                      )}
                      style={{
                        height: isPlaying ? `${Math.max(14, (Math.sin(i * 0.7) + 1) * 45 + 14)}px` : '14px',
                        animationDelay: `${i * 0.07}s`,
                      }}
                    />
                  ))}
                </div>

                {/* Album art / headphones orb */}
                <div
                  className={cn(
                    'w-32 h-32 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center shadow-2xl transition-all duration-700 relative z-10',
                    isPlaying ? 'scale-110 ring-4 ring-royal-blue-500/30 ring-offset-4 ring-offset-gray-950' : 'scale-100'
                  )}
                >
                  {sermon.thumbnail ? (
                    <img
                      src={resolveApiUrl(sermon.thumbnail)}
                      alt={sermon.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-royal-blue-500 via-royal-blue-600 to-indigo-700 flex items-center justify-center">
                      <Headphones className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>

                {/* Sermon title & speaker */}
                <p className="text-white text-base font-bold text-center z-10 max-w-xs leading-snug">{sermon.title}</p>
                {sermon.audios && sermon.audios.length > 0 && (
                  <p className="text-amber-400 text-xs font-bold mt-1 z-10">
                    Playing: {formatTrackTitle(activeTrack.title)}
                  </p>
                )}
                <p className="text-royal-blue-300 text-xs mt-1.5 z-10">{sermon.speaker}</p>

                {/* Audio badge */}
                <span className="mt-4 z-10 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-400 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5">
                  <Headphones className="w-3 h-3" />
                  {sermon.audios && sermon.audios.length > 0 ? 'Sermon Series' : 'Audio Sermon'}
                </span>
              </div>

              {/* Player Controls Panel */}
              <div className="bg-gradient-to-t from-black/95 via-black/80 to-transparent p-5 z-20">
                {/* Progress bar */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-white/60 text-[10px] font-bold font-mono w-10 text-right">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 accent-royal-blue-500 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer outline-none"
                  />
                  <span className="text-white/60 text-[10px] font-bold font-mono w-10">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Bottom toolbar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Play/Pause */}
                    <button
                      onClick={togglePlay}
                      className="w-11 h-11 rounded-full bg-royal-blue-600 hover:bg-royal-blue-500 flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-royal-blue-500/30"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white fill-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      )}
                    </button>

                    {/* Volume control */}
                    <div className="flex items-center gap-2">
                      <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-20 accent-royal-blue-400 h-1 bg-white/20 rounded-full appearance-none cursor-pointer outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Download Audio */}
                    {activeTrack.audioUrl && (
                      <a
                        href={resolveApiUrl(activeTrack.audioUrl)}
                        download={getDownloadFilename(activeTrack.title)}
                        onClick={handleDownloadIncrement}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all text-xs font-semibold"
                        title={`Download ${formatTrackTitle(activeTrack.title)}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download ({localDownloads || 0})
                      </a>
                    )}

                    {/* Duration info */}
                    <div className="flex items-center gap-1.5 text-white/40 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      {activeTrack.duration}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Playlist Container (Only for Series) */}
            {sermon.audios && sermon.audios.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Sermon Series Tracks</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{sermon.audios.length} parts in this message series</p>
                  </div>
                  <button
                    onClick={downloadAllTracks}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-royal-blue-600 hover:bg-royal-blue-700 text-white transition-all text-xs font-bold shadow-md shadow-royal-blue-600/15"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Series (All Parts)
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {sermon.audios.map((track, idx) => {
                    const isActive = idx === currentTrackIndex;
                    return (
                      <div
                        key={track.id}
                        className={cn(
                          'flex items-center justify-between py-3.5 px-4 -mx-4 rounded-xl transition-all',
                          isActive 
                            ? 'bg-royal-blue-50/70 border border-royal-blue-100' 
                            : 'hover:bg-gray-50/50'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => {
                              setCurrentTrackIndex(idx);
                              setIsPlaying(true);
                              setTimeout(() => {
                                const media = audioRef.current;
                                if (media) {
                                  media.play().catch((err) => console.log('Playback failed:', err));
                                }
                              }, 100);
                            }}
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                              isActive 
                                ? 'bg-royal-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                          >
                            {isActive && isPlaying ? (
                              <span className="w-2.5 h-2.5 flex items-center justify-center gap-0.5">
                                <span className="w-0.5 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <span className="w-0.5 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                                <span className="w-0.5 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
                              </span>
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            )}
                          </button>
                          
                          <div className="min-w-0">
                            <p className={cn('text-sm font-bold truncate max-w-[280px]', isActive ? 'text-royal-blue-700' : 'text-gray-900')}>
                              {formatTrackTitle(track.title, true)}
                            </p>
                            <span className="text-[10px] text-gray-400 font-semibold">{track.duration}</span>
                          </div>
                        </div>

                        <a
                          href={resolveApiUrl(track.audioUrl)}
                          download={getDownloadFilename(track.title)}
                          onClick={handleDownloadIncrement}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-450 hover:text-gray-700 transition-colors"
                          title={`Download ${formatTrackTitle(track.title)}`}
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sermon Metadata Info */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-4">
                <span className="px-2.5 py-1 rounded-lg bg-royal-blue-50 text-royal-blue-600 font-bold uppercase tracking-wider">
                  {sermon.category}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(sermon.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {localViews.toLocaleString()} views
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" />
                  {(localDownloads || 0).toLocaleString()} downloads
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                  {sermon.title}
                </h1>
                <button
                  onClick={() => toggleLikeItem('sermon', sermon.id)}
                  className={cn(
                    "p-2.5 rounded-xl border transition-all cursor-pointer flex-shrink-0",
                    isLiked
                      ? "bg-red-50 border-red-200 text-red-500 shadow-sm"
                      : "bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50/20"
                  )}
                  title={isLiked ? "Unlike message" : "Like message"}
                >
                  <Heart className={cn("w-5 h-5", isLiked && "fill-red-500")} />
                </button>
              </div>

              {/* Speaker card */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 border border-gray-100 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-royal-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-royal-blue-600/15">
                    {sermon.speaker.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{sermon.speaker}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Ministering Pastor</p>
                  </div>
                </div>

                {activeTrack.audioUrl && (
                  <a
                    href={resolveApiUrl(activeTrack.audioUrl)}
                    download={getDownloadFilename(activeTrack.title)}
                    onClick={handleDownloadIncrement}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-royal-blue-600 hover:bg-royal-blue-500 text-white hover:text-white transition-all text-xs font-bold shadow-md shadow-royal-blue-600/15"
                  >
                    <Download className="w-4 h-4" />
                    Download {sermon.audios && sermon.audios.length > 0 ? 'Current Part' : 'Audio Message'} ({localDownloads || 0})
                  </a>
                )}
              </div>

              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-3 mb-3">
                Message Overview
              </h3>
              <p className="text-gray-600 text-base leading-relaxed whitespace-pre-line">
                {sermon.description}
              </p>
            </div>

            {/* Interactive Note-taking Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Sermon Notes</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Auto-saves to your local browser storage</p>
                </div>
                <button
                  onClick={downloadNotes}
                  disabled={!notes.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 hover:text-royal-blue-600 hover:bg-royal-blue-50 border border-gray-200 hover:border-royal-blue-100 disabled:opacity-50 disabled:pointer-events-none transition-all text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Notes
                </button>
              </div>

              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Start typing your study notes here during the sermon..."
                className="w-full min-h-[160px] p-4 bg-gray-55/50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 focus:bg-white transition-all resize-y"
              />
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 mt-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-royal-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  Comments ({comments.length})
                </h3>
              </div>

              {/* Comment Form */}
              <form onSubmit={handleAddComment} className="mb-8 bg-gray-50 border border-gray-100 p-6 rounded-2xl">
                <h4 className="text-sm font-bold text-gray-900 mb-4">Share Your Thoughts</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="comment-name" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Your Name</label>
                    <input
                      id="comment-name"
                      type="text"
                      value={newCommentName}
                      onChange={(e) => setNewCommentName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 text-sm transition-all bg-white text-gray-800"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="comment-text" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Your Comment</label>
                    <textarea
                      id="comment-text"
                      rows={4}
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 text-sm transition-all resize-none bg-white text-gray-800"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newCommentName.trim() || !newCommentText.trim() || isSubmittingComment}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-royal-blue-600 to-royal-blue-700 hover:from-royal-blue-700 hover:to-royal-blue-800 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-md shadow-royal-blue-500/10 cursor-pointer border-none"
                    >
                      {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {!Array.isArray(comments) || comments.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No comments yet. Be the first to share your thoughts!</p>
                ) : (
                  <>
                    {comments
                      .slice((commentPage - 1) * COMMENTS_PER_PAGE, commentPage * COMMENTS_PER_PAGE)
                      .map((comment) => {
                        if (!comment) return null;
                        const initials = comment.name ? comment.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
                        let formattedDate = '';
                        if (comment.created_at) {
                          const d = new Date(comment.created_at);
                          if (!isNaN(d.getTime())) {
                            formattedDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                          }
                        }
                        return (
                          <div key={comment.id} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-royal-blue-100 to-royal-blue-200 text-royal-blue-700 flex items-center justify-center font-bold text-sm shadow-sm">
                              {initials}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-baseline justify-between mb-1">
                                <h4 className="text-sm font-bold text-gray-900">{comment.name}</h4>
                                {formattedDate && (
                                  <span className="text-[9px] font-semibold text-gray-400">
                                    {formattedDate}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-650 text-xs leading-relaxed whitespace-pre-line">{comment.text}</p>
                            </div>
                          </div>
                        );
                      })}

                    {/* Pagination Controls */}
                    {comments.length > COMMENTS_PER_PAGE && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4 text-xs">
                        <span className="text-gray-500 font-medium">
                          Showing {((commentPage - 1) * COMMENTS_PER_PAGE) + 1} - {Math.min(commentPage * COMMENTS_PER_PAGE, comments.length)} of {comments.length} comments
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCommentPage(prev => Math.max(prev - 1, 1))}
                            disabled={commentPage === 1}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-all"
                          >
                            Previous
                          </button>
                          <span className="px-3 py-1.5 text-gray-600 font-semibold">
                            Page {commentPage} of {Math.ceil(comments.length / COMMENTS_PER_PAGE)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCommentPage(prev => Math.min(prev + 1, Math.ceil(comments.length / COMMENTS_PER_PAGE)))}
                            disabled={commentPage >= Math.ceil(comments.length / COMMENTS_PER_PAGE)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-all"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar Area (Right 1 Column) */}
          <div className="space-y-6">
            
            {/* Share Sermon Box */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">
                Share Message
              </h3>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={window.location.origin + `/sermon/${sermon.id}`}
                  className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 focus:outline-none outline-none select-all"
                />
                <button
                  onClick={copyLink}
                  className="w-10 h-10 rounded-xl bg-royal-blue-50 border border-royal-blue-100 text-royal-blue-600 hover:bg-royal-blue-100 flex items-center justify-center transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Check out this sermon: ' + sermon.title + ' ' + window.location.origin + '/sermon/' + sermon.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-150 hover:bg-emerald-50 hover:border-emerald-200 text-xs font-semibold text-gray-600 hover:text-emerald-700 transition-colors"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Watch ' + sermon.title + ' by ' + sermon.speaker)}&url=${encodeURIComponent(window.location.origin + '/sermon/' + sermon.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-150 hover:bg-sky-50 hover:border-sky-200 text-xs font-semibold text-gray-600 hover:text-sky-700 transition-colors"
                >
                  Twitter
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/sermon/' + sermon.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-150 hover:bg-blue-50 hover:border-blue-200 text-xs font-semibold text-gray-600 hover:text-blue-700 transition-colors"
                >
                  Facebook
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + '/sermon/' + sermon.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-150 hover:bg-blue-50 hover:border-blue-200 text-xs font-semibold text-gray-600 hover:text-blue-800 transition-colors"
                >
                  LinkedIn
                </a>
              </div>
            </div>

            {/* Related Sermons Sidebar list */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-5">
                Related Messages
              </h3>

              <div className="space-y-4">
                {relatedSermons.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSermonSelect(rel)}
                    className="flex gap-3 group cursor-pointer hover:bg-gray-50/50 p-2 -m-2 rounded-xl transition-all"
                  >
                    <div className="w-20 aspect-video rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                      <img
                        src={resolveApiUrl(rel.thumbnail)}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-royal-blue-600 transition-colors line-clamp-2 leading-snug">
                        {rel.title}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">{rel.speaker}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {rel.duration}
                        </span>
                        <span>•</span>
                        <span>{rel.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
