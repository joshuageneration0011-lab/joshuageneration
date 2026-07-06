import { useState } from 'react';
import {
  Mic, MicOff, Video, VideoOff, Monitor, Hand, MessageSquare,
  ThumbsUp, Users, PhoneOff, ChevronLeft, Maximize2, Minimize2,
  X, Send, Plus, Smile, Paperclip,
  Clock, Pin, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  avatar: string;
}

interface ChatMessage {
  id: string;
  name: string;
  message: string;
  time: string;
  isHost?: boolean;
}

const participants: Participant[] = [
  { id: 'p1', name: 'Apostle Joshua Iyemifokhae', isHost: true, isSpeaking: true, isMuted: false, isVideoOn: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
  { id: 'p2', name: 'Sarah Williams', isHost: false, isSpeaking: false, isMuted: true, isVideoOn: true, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
  { id: 'p3', name: 'David Thompson', isHost: false, isSpeaking: false, isMuted: false, isVideoOn: true, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80' },
  { id: 'p4', name: 'Rachel Grace', isHost: false, isSpeaking: false, isMuted: true, isVideoOn: false, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' },
  { id: 'p5', name: 'Mark Johnson', isHost: false, isSpeaking: false, isMuted: true, isVideoOn: true, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80' },
  { id: 'p6', name: 'Emily Watson', isHost: false, isSpeaking: false, isMuted: true, isVideoOn: false, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80' },
  { id: 'p7', name: 'Michael Adebayo', isHost: false, isSpeaking: false, isMuted: true, isVideoOn: true, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80' },
  { id: 'p8', name: 'Esther Kim', isHost: false, isSpeaking: false, isMuted: true, isVideoOn: false, avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80' },
];

const initialMessages: ChatMessage[] = [
  { id: 'm1', name: 'Sarah Williams', message: 'Praise the Lord! So blessed to be here tonight.', time: '7:32 PM' },
  { id: 'm2', name: 'David Thompson', message: 'Amen! Ready for a powerful word.', time: '7:33 PM' },
  { id: 'm3', name: 'Apostle Joshua Iyemifokhae', message: 'Welcome everyone! Let us begin with a word of prayer.', time: '7:34 PM', isHost: true },
  { id: 'm4', name: 'Emily Watson', message: 'Praying from London! God bless you all.', time: '7:35 PM' },
];

export default function LivePlatform() {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSidebar, setActiveSidebar] = useState<'chat' | 'participants' | 'prayer'>('chat');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const [chatInput, setChatInput] = useState('');
  const [isReactionsOpen, setIsReactionsOpen] = useState(false);
  const layout = 'grid';
  const elapsedTime = '00:12:45';

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: `m${Date.now()}`,
      name: 'You',
      message: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages([...chatMessages, newMsg]);
    setChatInput('');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const videoParticipants = participants.filter(p => p.isVideoOn);
  const audioOnlyParticipants = participants.filter(p => !p.isVideoOn);
  const visibleVideos = layout === 'grid' ? videoParticipants : videoParticipants;

  return (
    <section id="live" className="relative min-h-screen bg-gray-950 pt-16 lg:pt-20 pb-20 lg:pb-0 overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-16 lg:top-20 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-white font-semibold text-sm">Kingdom Prayer Meeting</h2>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Clock className="w-3 h-3" />
              <span>{elapsedTime}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 text-white/80 text-xs font-medium hover:bg-white/20 transition-colors">
            <Users className="w-3.5 h-3.5" />
            <span>{participants.length}</span>
          </button>
          <button onClick={toggleFullscreen} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* Video Grid Area */}
      <div className="h-full pt-24 pb-24 lg:pb-20 px-4">
        <div className={cn(
          'grid gap-3 h-full max-w-6xl mx-auto',
          layout === 'grid'
            ? visibleVideos.length <= 2
              ? 'grid-cols-1 md:grid-cols-2'
              : visibleVideos.length <= 4
                ? 'grid-cols-2'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            : 'grid-cols-1'
        )}>
          {/* Host Video (larger) */}
          {visibleVideos.length > 0 && (
            <div className={cn(
              'relative rounded-2xl overflow-hidden bg-gray-800 aspect-video group cursor-pointer',
              layout === 'grid' && visibleVideos.length <= 2 && 'md:row-span-1',
              layout === 'grid' && visibleVideos.length === 1 && 'md:col-span-2'
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-royal-blue-900/30 to-gray-900/80" />
              <img
                src={visibleVideos[0].avatar}
                alt={visibleVideos[0].name}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
              {/* Speaking indicator */}
              {visibleVideos[0].isSpeaking && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 text-[10px] font-medium">Speaking</span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-400 overflow-hidden">
                  <img src={visibleVideos[0].avatar} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{visibleVideos[0].name}</p>
                  <p className="text-white/50 text-[10px]">Host</p>
                </div>
              </div>
              {visibleVideos[0].isMuted && (
                <div className="absolute bottom-3 right-3 w-7 h-7 rounded-lg bg-red-500/80 flex items-center justify-center">
                  <MicOff className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              {/* Hover controls */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Pin className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}

          {/* Other Videos */}
          {visibleVideos.slice(1).map((participant) => (
            <div key={participant.id} className="relative rounded-2xl overflow-hidden bg-gray-800 aspect-video group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
              <img
                src={participant.avatar}
                alt={participant.name}
                className="w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <p className="text-white text-xs font-medium">{participant.name}</p>
              </div>
              {participant.isMuted && (
                <div className="absolute bottom-3 right-3 w-7 h-7 rounded-lg bg-red-500/80 flex items-center justify-center">
                  <MicOff className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <button className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          ))}

          {/* Audio-only participants */}
          {audioOnlyParticipants.slice(0, 2).map((participant) => (
            <div key={participant.id} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 aspect-video flex items-center justify-center group cursor-pointer border border-gray-700/50">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-royal-blue-500 to-royal-blue-700 flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <span className="text-white text-xl font-bold">
                    {participant.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <p className="text-white text-xs font-medium">{participant.name}</p>
                <p className="text-white/40 text-[10px] mt-0.5">Audio only</p>
              </div>
              {participant.isMuted && (
                <div className="absolute bottom-3 right-3 w-7 h-7 rounded-lg bg-red-500/80 flex items-center justify-center">
                  <MicOff className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gray-900/90 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center justify-center gap-1 sm:gap-2 px-4 py-3 max-w-3xl mx-auto">
          {/* Mic */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              'p-3 sm:p-4 rounded-xl transition-all duration-200',
              isMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-white/10 text-white hover:bg-white/20 border border-transparent'
            )}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={cn(
              'p-3 sm:p-4 rounded-xl transition-all duration-200',
              !isVideoOn
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-white/10 text-white hover:bg-white/20 border border-transparent'
            )}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Share Screen */}
          <button className="p-3 sm:p-4 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors border border-transparent hidden sm:block">
            <Monitor className="w-5 h-5" />
          </button>

          {/* Raise Hand */}
          <button
            onClick={() => setIsHandRaised(!isHandRaised)}
            className={cn(
              'p-3 sm:p-4 rounded-xl transition-all duration-200',
              isHandRaised
                ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30 animate-pulse'
                : 'bg-white/10 text-white hover:bg-white/20 border border-transparent'
            )}
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Reactions */}
          <div className="relative">
            <button
              onClick={() => setIsReactionsOpen(!isReactionsOpen)}
              className="p-3 sm:p-4 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors border border-transparent"
            >
              <ThumbsUp className="w-5 h-5" />
            </button>
            {isReactionsOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 rounded-2xl bg-gray-800 border border-gray-700 shadow-xl flex gap-2">
                {['👍', '❤️', '🙏', '🕊️', '🔥', '👏'].map((emoji, i) => (
                  <button
                    key={i}
                    className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg transition-colors hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat Toggle */}
          <button
            onClick={() => { setIsSidebarOpen(!isSidebarOpen); setActiveSidebar('chat'); }}
            className={cn(
              'p-3 sm:p-4 rounded-xl transition-all duration-200 border',
              isSidebarOpen && activeSidebar === 'chat'
                ? 'bg-royal-blue-500/20 text-royal-blue-400 border-royal-blue-500/30'
                : 'bg-white/10 text-white hover:bg-white/20 border-transparent'
            )}
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Participants */}
          <button
            onClick={() => { setIsSidebarOpen(!isSidebarOpen); setActiveSidebar('participants'); }}
            className={cn(
              'p-3 sm:p-4 rounded-xl transition-all duration-200 border hidden sm:block',
              isSidebarOpen && activeSidebar === 'participants'
                ? 'bg-royal-blue-500/20 text-royal-blue-400 border-royal-blue-500/30'
                : 'bg-white/10 text-white hover:bg-white/20 border-transparent'
            )}
          >
            <Users className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center">
              {participants.length}
            </span>
          </button>

          {/* Leave */}
          <button className="p-3 sm:px-6 sm:py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors ml-2 sm:ml-4 flex items-center gap-2">
            <PhoneOff className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-semibold">Leave</span>
          </button>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className={cn(
        'absolute top-16 lg:top-20 right-0 bottom-24 lg:bottom-0 z-10 w-full sm:w-96 bg-gray-900/95 backdrop-blur-xl border-l border-white/10 transition-transform duration-300',
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Sidebar Tabs */}
        <div className="flex border-b border-white/10">
          {[
            { id: 'chat', label: 'Chat', icon: MessageSquare },
            { id: 'participants', label: 'People', icon: Users },
            { id: 'prayer', label: 'Prayer', icon: Hand },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSidebar(tab.id as 'chat' | 'participants' | 'prayer')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-medium transition-colors',
                activeSidebar === tab.id
                  ? 'text-gold-400 border-b-2 border-gold-500 bg-gold-500/5'
                  : 'text-white/50 hover:text-white/80'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="px-3 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Panel */}
        {activeSidebar === 'chat' && (
          <div className="flex flex-col h-[calc(100%-48px)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={cn(
                  'flex gap-2.5',
                  msg.name === 'You' ? 'flex-row-reverse' : ''
                )}>
                  {msg.name !== 'You' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-royal-blue-500 to-royal-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-[9px] font-bold">
                        {msg.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <div className={cn(
                    'max-w-[80%]',
                    msg.name === 'You' ? 'items-end' : ''
                  )}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-medium text-white/50">
                        {msg.name === 'You' ? 'You' : msg.name}
                      </span>
                      {msg.isHost && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-gold-500/20 text-gold-400 font-medium">Host</span>
                      )}
                      <span className="text-[9px] text-white/30">{msg.time}</span>
                    </div>
                    <div className={cn(
                      'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                      msg.name === 'You'
                        ? 'bg-royal-blue-600 text-white rounded-tr-md'
                        : msg.isHost
                          ? 'bg-gold-500/10 text-gold-200 border border-gold-500/20 rounded-tl-md'
                          : 'bg-white/10 text-white/90 rounded-tl-md'
                    )}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-white/10">
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                <button className="text-white/40 hover:text-white/70 transition-colors">
                  <Smile className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-white text-sm placeholder-white/40 focus:outline-none"
                />
                <button className="text-white/40 hover:text-white/70 transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  onClick={sendMessage}
                  className="w-8 h-8 rounded-lg bg-royal-blue-600 flex items-center justify-center hover:bg-royal-blue-500 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Participants Panel */}
        {activeSidebar === 'participants' && (
          <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-48px)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Participants ({participants.length})</h3>
              <button className="text-white/50 text-xs hover:text-white/80 transition-colors flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                Invite
              </button>
            </div>
            {participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={p.avatar} alt={p.name} className="w-9 h-9 rounded-full object-cover" />
                    {p.isSpeaking && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-gray-900" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{p.name}</p>
                      {p.isHost && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gold-500/20 text-gold-400 font-medium">Host</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/40">
                      {p.isMuted ? (
                        <span className="flex items-center gap-1 text-red-400"><MicOff className="w-3 h-3" /> Muted</span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400"><Mic className="w-3 h-3" /> Live</span>
                      )}
                      <span>•</span>
                      <span>{p.isVideoOn ? 'Video on' : 'Audio only'}</span>
                    </div>
                  </div>
                </div>
                <button className="text-white/30 hover:text-white/60 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Prayer Panel */}
        {activeSidebar === 'prayer' && (
          <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-48px)]">
            <div className="text-center mb-4">
              <h3 className="text-white font-semibold text-sm">Prayer Requests</h3>
              <p className="text-white/40 text-xs mt-1">Standing in faith together</p>
            </div>
            <div className="p-4 rounded-xl bg-royal-blue-500/10 border border-royal-blue-500/20">
              <textarea
                placeholder="Share a prayer request..."
                className="w-full h-20 px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder-white/40 resize-none focus:outline-none focus:ring-1 focus:ring-gold-500/50"
              />
              <button className="mt-2 w-full px-4 py-2 bg-gold-500 text-gray-900 rounded-xl font-semibold text-xs hover:bg-gold-400 transition-colors">
                Submit Prayer Request
              </button>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Anonymous', request: 'Praying for healing in my family. God restore us.', count: 24 },
                { name: 'Sarah W.', request: 'Please pray for the conference outreach tomorrow.', count: 18 },
                { name: 'David T.', request: 'Pray for the youth ministry, that God would raise leaders.', count: 15 },
              ].map((pr, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-white font-medium text-xs">{pr.name}</span>
                    <span className="text-white/30 text-[10px]">•</span>
                    <span className="text-white/40 text-[10px]">{pr.count} praying</span>
                  </div>
                  <p className="text-white/70 text-xs leading-relaxed">{pr.request}</p>
                  <button className="mt-2 text-[10px] text-royal-blue-400 hover:text-royal-blue-300 font-medium">
                    I prayed 🙏
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
