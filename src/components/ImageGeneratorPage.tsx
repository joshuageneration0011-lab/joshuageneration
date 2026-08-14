import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  Copy, 
  Check, 
  Key, 
  RefreshCw, 
  Wand2, 
  ExternalLink, 
  Sliders, 
  History, 
  AlertCircle,
  Maximize2,
  X,
  Upload,
  Video,
  Layers
} from 'lucide-react';
import { api } from '@/utils/api';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  size: string;
  model: string;
  modelLabel: string;
  createdAt: string;
}

const PROMPT_SUGGESTIONS = [
  "A majestic golden lion with glowing angel wings standing on a mountain peak at sunset, ultra realistic 8k",
  "A futuristic sanctuary surrounded by lush digital gardens and glowing neon lights, cinematic lighting",
  "A serene oil painting of a peaceful dawn over ancient Jerusalem with golden sunlight piercing through clouds",
  "Digital artwork of a celestial warrior armor crafted from divine light and gold trim, detailed 3D render",
  "An abstract watercolor portrait symbolizing faith, transformation, and divine grace with gold foil accents"
];

const STYLE_TAGS = [
  "Photorealistic",
  "Digital Art",
  "Cinematic Lighting",
  "Oil Painting",
  "3D Render",
  "Watercolor",
  "Cyberpunk",
  "Fantasy Concept Art"
];

const THUMBNAIL_STYLES = [
  "Golden Anointing & Light",
  "Cinematic 4K Ministry Widescreen",
  "High-Impact 3D Glow",
  "Bold Modern Typographic",
  "Celestial Fire & Glory"
];

const SIZES = [
  { label: '16:9 Widescreen', value: '16:9', desc: 'YouTube Thumbnail (1280x720)' },
  { label: '1024 x 1024', value: '1024x1024', desc: 'High Quality Square' },
  { label: '512 x 512', value: '512x512', desc: 'Standard Square' },
];

const AI_MODELS = [
  { id: 'flux-schnell', label: 'FLUX.1 Schnell', desc: 'Ultra-fast 8K Photorealistic AI (Recommended)' },
  { id: 'flux-dev', label: 'FLUX.1 Dev Studio', desc: 'High-Precision & Detailed Art Engine' },
  { id: 'realvis-xl', label: 'RealVisXL 4.0', desc: 'Hyper-Realistic Human Portraits & Photos' },
  { id: 'recraft-v3', label: 'Recraft V3', desc: 'Graphic Design, Vectors & Logos' },
];

interface ImageGeneratorPageProps {
  onNavigate?: (page: string) => void;
}

export default function ImageGeneratorPage({ onNavigate }: ImageGeneratorPageProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => api.isAuthenticated());
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Studio Mode: 'thumbnail' (YouTube Widescreen + Ref Image + Text) vs 'art' (Square AI Art)
  const [studioMode, setStudioMode] = useState<'thumbnail' | 'art'>('thumbnail');

  // Thumbnail Specific State
  const [thumbnailTitle, setThumbnailTitle] = useState('');
  const [thumbnailSubtitle, setThumbnailSubtitle] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageName, setReferenceImageName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState('');
  const [selectedSize, setSelectedSize] = useState('16:9');
  const [selectedModel, setSelectedModel] = useState<string>('flux-schnell');
  const [selectedStyle, setSelectedStyle] = useState<string | null>("Golden Anointing & Light");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResults, setCurrentResults] = useState<GeneratedImage[]>([]);
  const [currentResult, setCurrentResult] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Load saved history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('jg_image_gen_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setAuthError('Please enter both admin email and password.');
      return;
    }
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await api.login(adminEmail.trim(), adminPassword.trim());
      if (res.success) {
        setIsAuthenticated(true);
      } else {
        setAuthError(res.error || 'Invalid administrator credentials.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to authenticate.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file must be smaller than 10MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setReferenceImage(event.target?.result as string);
        setReferenceImageName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSurpriseMe = () => {
    if (studioMode === 'thumbnail') {
      const titles = [
        "THE ANOINTING THAT BREAKS YOKES",
        "WALKING IN DIVINE AUTHORITY",
        "UNSHAKABLE FAITH IN TRYING TIMES",
        "THE SUPERNATURAL BREAKTHROUGH",
        "VICTORY THROUGH PRAISE AND PRAYER"
      ];
      const randomTitle = titles[Math.floor(Math.random() * titles.length)];
      setThumbnailTitle(randomTitle);
      setThumbnailSubtitle("Apostle Joshua Iyemifokhae");
    } else {
      const randomPrompt = PROMPT_SUGGESTIONS[Math.floor(Math.random() * PROMPT_SUGGESTIONS.length)];
      setPrompt(randomPrompt);
    }
  };

  const handleAddStyle = (style: string) => {
    if (selectedStyle === style) {
      setSelectedStyle(null);
      return;
    }
    setSelectedStyle(style);
  };

  const getFinalPrompt = () => {
    if (studioMode === 'thumbnail') {
      const mainTitle = thumbnailTitle.trim() || "THE ANOINTING";
      const subTitle = thumbnailSubtitle.trim();
      let p = `A professional 16:9 widescreen YouTube thumbnail background featuring bold headline title "${mainTitle}"${subTitle ? ` and subtext "${subTitle}"` : ''}, dramatic lighting, 8K resolution`;
      if (selectedStyle) {
        p += `, ${selectedStyle.toLowerCase()} style`;
      }
      return p;
    }

    let p = prompt.trim();
    if (selectedStyle) {
      p = `${p}, ${selectedStyle.toLowerCase()} style`;
    }
    return p;
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    let finalPrompt = '';
    let aspectRatio = '16:9';

    if (studioMode === 'thumbnail') {
      if (!thumbnailTitle.trim() && !prompt.trim()) {
        setError('Please enter a Title for your YouTube thumbnail.');
        return;
      }
      finalPrompt = getFinalPrompt();
      aspectRatio = '16:9';
    } else {
      finalPrompt = getFinalPrompt();
      if (!finalPrompt) {
        setError('Please enter a description for the image you want to generate.');
        return;
      }
      aspectRatio = selectedSize === '16:9' ? '16:9' : '1:1';
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.generateImage({
        prompt: finalPrompt,
        size: selectedSize,
        n: 4,
        model: selectedModel,
        aspect_ratio: aspectRatio,
        image: referenceImage || undefined
      });

      if (res.output && res.output.length > 0) {
        const selectedModelObj = AI_MODELS.find(m => m.id === selectedModel);
        const modelLabel = (res as any).modelLabel || (selectedModelObj ? selectedModelObj.label : selectedModel);
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const newImages: GeneratedImage[] = res.output.map((url: string, idx: number) => ({
          id: `${Date.now()}-${idx}`,
          url,
          prompt: finalPrompt,
          size: studioMode === 'thumbnail' ? '16:9 Widescreen' : selectedSize,
          model: selectedModel,
          modelLabel: modelLabel,
          createdAt: timestamp
        }));

        setCurrentResults(newImages);
        setCurrentResult(newImages[0]);

        setHistory(prev => {
          const updated = [...newImages, ...prev].slice(0, 36);
          localStorage.setItem('jg_image_gen_history', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      if (err.message && err.message.toLowerCase().includes('unauthorized')) {
        setIsAuthenticated(false);
        setError('Admin session expired. Please authenticate again.');
      } else {
        setError(err.message || 'Failed to generate image. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleDownload = async (imageUrl: string, filenamePrompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `jg-artwork-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(imageUrl, '_blank');
    }
  };

  // --- ADMIN LOCK SCREEN IF NOT AUTHENTICATED ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pt-28 pb-16 px-4 flex items-center justify-center relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <Key className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Admin Access <span className="text-amber-400">Required</span>
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
              The AI Image Studio is restricted to authorized Joshua's Generation ministry administrators.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 pt-2">
            {authError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder=""
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl p-3.5 text-slate-100 text-xs outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder=""
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl p-3.5 text-slate-100 text-xs outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs tracking-wider uppercase shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Authenticate & Unlock Studio</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-yellow-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Studio • Premium Creative Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              AI Image <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">Generator</span>
            </h1>
            <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-2xl">
              Transform your words and vision into high-quality visual art powered by advanced AI.
            </p>
          </div>
        </div>

        {/* Main Grid: Left Controls, Right Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Controls Panel (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setStudioMode('thumbnail');
                  setSelectedSize('16:9');
                }}
                className={`py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  studioMode === 'thumbnail'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>YouTube Thumbnail Studio</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStudioMode('art');
                  setSelectedSize('1024x1024');
                }}
                className={`py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  studioMode === 'art'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Custom AI Art Studio</span>
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-6">

              {studioMode === 'thumbnail' ? (
                <>
                  {/* YouTube Reference Image Upload */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-amber-400" />
                        <span>Reference Photo / Picture (Optional)</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Your photo for the thumbnail</span>
                    </label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    {referenceImage ? (
                      <div className="flex items-center justify-between p-3 bg-slate-950/90 border border-amber-500/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <img
                            src={referenceImage}
                            alt="Reference"
                            className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                          />
                          <div>
                            <p className="text-xs font-semibold text-white truncate max-w-[200px]">
                              {referenceImageName || 'Uploaded Picture'}
                            </p>
                            <p className="text-[10px] text-amber-400">Reference Photo Loaded ✓</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setReferenceImage(null);
                            setReferenceImageName(null);
                          }}
                          className="p-2 text-slate-400 hover:text-red-400 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-4 rounded-xl border border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-950/40 hover:bg-amber-500/5 text-slate-400 hover:text-amber-300 text-xs font-medium flex flex-col items-center justify-center gap-2 transition"
                      >
                        <Upload className="w-6 h-6 text-amber-400/80" />
                        <span>Click to Upload Reference Picture (Pastor photo / Subject)</span>
                        <span className="text-[10px] text-slate-500">PNG, JPG, WEBP up to 10MB</span>
                      </button>
                    )}
                  </div>

                  {/* Thumbnail Title */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-amber-400" />
                        <span>Thumbnail Main Title</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleSurpriseMe}
                        className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Sample Title</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={thumbnailTitle}
                      onChange={(e) => setThumbnailTitle(e.target.value)}
                      placeholder="e.g. THE ANOINTING THAT BREAKS YOKES"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3.5 text-slate-100 placeholder-slate-600 text-sm outline-none transition"
                    />
                  </div>

                  {/* Thumbnail Subtitle */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Sub-Title / Host Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={thumbnailSubtitle}
                      onChange={(e) => setThumbnailSubtitle(e.target.value)}
                      placeholder="e.g. Apostle Joshua Iyemifokhae • Live Service"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3 text-slate-100 placeholder-slate-600 text-xs outline-none transition"
                    />
                  </div>
                </>
              ) : (
                /* Square AI Art Prompt Textarea */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-amber-400" />
                      <span>Image Prompt</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSurpriseMe}
                      className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Surprise Me</span>
                    </button>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={4}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the image you want to generate in detail..."
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-4 text-slate-100 placeholder-slate-500 text-sm outline-none transition resize-none"
                    />
                    {prompt && (
                      <button
                        type="button"
                        onClick={() => setPrompt('')}
                        className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Style Presets */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {studioMode === 'thumbnail' ? 'YouTube Design Style Presets' : 'Art Style Presets'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(studioMode === 'thumbnail' ? THUMBNAIL_STYLES : STYLE_TAGS).map((style) => {
                    const isActive = selectedStyle === style;
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => handleAddStyle(style)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isActive
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {style} {isActive ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Engine Model Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Engine / Model</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {AI_MODELS.map((m) => {
                    const isSelected = selectedModel === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedModel(m.id as any)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`text-xs font-bold ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}>
                          {m.label} {isSelected ? '✓' : ''}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dimension Settings */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Output Dimensions</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {SIZES.map((s) => {
                    const isSelected = selectedSize === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSelectedSize(s.value)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`text-xs font-bold ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}>
                          {s.label}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{s.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Message Alert */}
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit / Generate Button */}
              <button
                type="submit"
                disabled={isLoading || (studioMode === 'thumbnail' ? !thumbnailTitle.trim() && !prompt.trim() : !prompt.trim())}
                className="w-full py-4 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Generating 4 {studioMode === 'thumbnail' ? 'YouTube Thumbnails' : 'Art Variations'}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate 4 {studioMode === 'thumbnail' ? 'YouTube Thumbnails' : 'Artworks'} (1-Click)</span>
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Right Showcase & Preview Panel (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col min-h-[460px] justify-between">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>Output Preview</span>
                </span>
                {currentResult && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                    {currentResult.modelLabel}
                  </span>
                )}
              </div>

              {/* Main Output Canvas Area */}
              <div className="relative aspect-square w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group">
                
                {isLoading ? (
                  <div className="flex flex-col items-center gap-4 p-6 text-center">
                    <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
                    <div>
                      <p className="text-slate-200 text-sm font-semibold animate-pulse">Rendering 4 unique images...</p>
                      <p className="text-slate-500 text-xs mt-1">Directly contacting {AI_MODELS.find(m=>m.id===selectedModel)?.label} engine</p>
                    </div>
                  </div>
                ) : currentResult ? (
                  <>
                    <img
                      src={currentResult.url}
                      alt={currentResult.prompt}
                      className="w-full h-full object-cover rounded-xl transition-all duration-300"
                    />
                    
                    {/* Hover Overlay Controls */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 p-4">
                      <button
                        onClick={() => setZoomImage(currentResult.url)}
                        className="p-3 rounded-full bg-slate-900/80 text-white hover:bg-amber-500 hover:text-slate-950 transition border border-slate-700"
                        title="View Full Screen"
                      >
                        <Maximize2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDownload(currentResult.url, currentResult.prompt)}
                        className="p-3 rounded-full bg-slate-900/80 text-white hover:bg-amber-500 hover:text-slate-950 transition border border-slate-700"
                        title="Download PNG"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-slate-300 text-sm font-medium">No Image Generated Yet</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs">
                        Enter a prompt on the left and click Generate to create 4 variations simultaneously.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 4-Variation Selector Grid */}
              {currentResults.length > 1 && !isLoading && (
                <div className="mt-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    4 Generated Variations (Click to select)
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {currentResults.map((item, idx) => {
                      const isActive = currentResult?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setCurrentResult(item)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            isActive 
                              ? 'border-amber-400 ring-2 ring-amber-500/50 scale-105 z-10' 
                              : 'border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-600'
                          }`}
                        >
                          <img src={item.url} alt={`Var ${idx+1}`} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 right-1 px-1 bg-slate-950/80 rounded text-[9px] font-bold text-amber-300">
                            #{idx + 1}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons for Current Result */}
              {currentResult && !isLoading && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                  <p className="text-xs text-slate-400 line-clamp-2 italic">
                    "{currentResult.prompt}"
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDownload(currentResult.url, currentResult.prompt)}
                      className="py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>

                    <button
                      onClick={() => handleCopyUrl(currentResult.url)}
                      className="py-2.5 px-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Copied Link!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* History Gallery */}
        {history.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <span>Recent Generations</span>
              </h3>
              <button
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem('jg_image_gen_history');
                }}
                className="text-xs text-slate-500 hover:text-slate-300 transition"
              >
                Clear History
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {history.map((img) => (
                <div
                  key={img.id}
                  onClick={() => {
                    setCurrentResult(img);
                    setCurrentResults([img]);
                  }}
                  className="group relative aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-800 cursor-pointer hover:border-amber-500/50 transition-all shadow-md"
                >
                  {/* Model Tag Pill */}
                  <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-slate-950/85 backdrop-blur-md border border-amber-500/40 text-[9px] font-bold text-amber-300 shadow-md">
                    {img.modelLabel || img.model}
                  </span>

                  <img
                    src={img.url}
                    alt={img.prompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-end">
                    <p className="text-[10px] text-slate-200 line-clamp-2">{img.prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Modal: Fullscreen Image Zoom */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-800">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-white hover:bg-amber-500 hover:text-slate-950 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={zoomImage} alt="Full view" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}

    </div>
  );
}
