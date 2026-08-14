import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { api } from '@/utils/api';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  size: string;
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

const SIZES = [
  { label: '1024 x 1024', value: '1024x1024', desc: 'High Quality Square' },
  { label: '512 x 512', value: '512x512', desc: 'Standard Square' },
  { label: '256 x 256', value: '256x256', desc: 'Fast Preview' },
];

const AI_MODELS = [
  { id: 'flux-schnell', label: 'FLUX.1 Schnell', desc: 'Ultra-fast 8K Photorealistic AI (Recommended)' },
  { id: 'flux-dev', label: 'FLUX.1 Dev Studio', desc: 'High-Precision & Detailed Art Engine' },
  { id: 'realvis-xl', label: 'RealVisXL 4.0', desc: 'Hyper-Realistic Human Portraits & Photos' },
  { id: 'recraft-v3', label: 'Recraft V3', desc: 'Graphic Design, Vectors & Logos' },
];

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [selectedModel, setSelectedModel] = useState<string>('flux-schnell');
  const [numOutputs, setNumOutputs] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  
  const [customApiKey, setCustomApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Load saved API key & history from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('jg_replicate_api_key') || '';
    if (savedKey) setCustomApiKey(savedKey);

    const savedHistory = localStorage.getItem('jg_image_gen_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    }
  }, []);

  const saveCustomKey = (key: string) => {
    setCustomApiKey(key);
    if (key.trim()) {
      localStorage.setItem('jg_replicate_api_key', key.trim());
    } else {
      localStorage.removeItem('jg_replicate_api_key');
    }
    setShowKeyModal(false);
  };

  const handleSurpriseMe = () => {
    const randomPrompt = PROMPT_SUGGESTIONS[Math.floor(Math.random() * PROMPT_SUGGESTIONS.length)];
    setPrompt(randomPrompt);
  };

  const handleAddStyle = (style: string) => {
    if (selectedStyle === style) {
      setSelectedStyle(null);
      return;
    }
    setSelectedStyle(style);
  };

  const getFinalPrompt = () => {
    let p = prompt.trim();
    if (selectedStyle) {
      p = `${p}, ${selectedStyle.toLowerCase()} style`;
    }
    return p;
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalPrompt = getFinalPrompt();

    if (!finalPrompt) {
      setError('Please enter a description for the image you want to generate.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.generateImage({
        prompt: finalPrompt,
        size: selectedSize,
        n: numOutputs,
        model: selectedModel,
        customApiKey: customApiKey || undefined
      });

      if (res.output && res.output.length > 0) {
        const newImage: GeneratedImage = {
          id: res.id || String(Date.now()),
          url: res.output[0],
          prompt: finalPrompt,
          size: selectedSize,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setCurrentResult(newImage);
        setHistory(prev => {
          const updated = [newImage, ...prev].slice(0, 20);
          localStorage.setItem('jg_image_gen_history', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate image. Please try again.');
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
      link.download = `dalle-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(imageUrl, '_blank');
    }
  };

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
              <span>AI Studio • Replicate DALL-E 2 API</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              AI Image <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">Generator</span>
            </h1>
            <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-2xl">
              Transform your words and vision into high-quality visual art powered by OpenAI DALL-E 2 model hosted on Replicate.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowKeyModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-slate-300 hover:text-white hover:border-amber-500/50 transition-all text-xs font-medium"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>{customApiKey ? 'API Key Configured' : 'Configure Replicate Key'}</span>
            </button>

            <a
              href="https://replicate.com/openai/dall-e-2/api"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-slate-200 transition text-xs"
            >
              <span>Doc</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Main Grid: Left Controls, Right Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Controls Panel (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <form onSubmit={handleGenerate} className="space-y-6">
              
              {/* Prompt Textarea */}
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

              {/* Style Presets */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Art Style Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_TAGS.map((style) => {
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
                    {error.includes('token missing') && (
                      <button
                        type="button"
                        onClick={() => setShowKeyModal(true)}
                        className="underline text-red-300 font-bold mt-1 inline-block"
                      >
                        Click here to set your Replicate API Token
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Submit / Generate Button */}
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="w-full py-4 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Generating Image with DALL-E 2...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Artwork</span>
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
                  <span className="text-[10px] text-slate-500 font-mono">
                    {currentResult.size} • {currentResult.createdAt}
                  </span>
                )}
              </div>

              {/* Output Canvas Area */}
              <div className="relative aspect-square w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group">
                
                {isLoading ? (
                  <div className="flex flex-col items-center gap-4 p-6 text-center">
                    <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
                    <div>
                      <p className="text-slate-200 text-sm font-semibold animate-pulse">Contacting Replicate API...</p>
                      <p className="text-slate-500 text-xs mt-1">DALL-E 2 is rendering your creation</p>
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
                        Enter a detailed prompt on the left and click Generate Artwork to start.
                      </p>
                    </div>
                  </div>
                )}
              </div>

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
                  onClick={() => setCurrentResult(img)}
                  className="group relative aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-800 cursor-pointer hover:border-amber-500/50 transition-all shadow-md"
                >
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

      {/* Modal: Custom Replicate API Key Config */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <span>Replicate API Token</span>
              </h3>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                By default, the server uses the <code className="text-amber-300">REPLICATE_API_TOKEN</code> in your server environment file. You can also provide a custom token here to override it in your browser session.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  API Token (r8_...)
                </label>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="r8_********************************"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-slate-100 text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => saveCustomKey('')}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
                >
                  Clear Key
                </button>
                <button
                  type="button"
                  onClick={() => saveCustomKey(customApiKey)}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-bold"
                >
                  Save Token
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
