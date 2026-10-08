import { useState, useRef } from 'react';
import {
  X,
  Upload,
  Link2,
  Image as ImageIcon,
  Check,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Maximize2,
  Loader2,
  ArrowUpToLine,
  ArrowDownToLine,
  MoveVertical
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { api } from '@/utils/api';
import { compressImage } from '@/utils/image';

export type EmailPhotoPosition = 'header' | 'centre' | 'foot';
export type EmailPhotoAlignment = 'center' | 'full' | 'left' | 'right';

interface EmailPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertPhoto: (position: EmailPhotoPosition, htmlSnippet: string) => void;
  themeColor?: 'emerald' | 'royal-blue';
}

export function EmailPhotoModal({
  isOpen,
  onClose,
  onInsertPhoto,
  themeColor = 'royal-blue'
}: EmailPhotoModalProps) {
  const [position, setPosition] = useState<EmailPhotoPosition>('header');
  const [sourceType, setSourceType] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [alignment, setAlignment] = useState<EmailPhotoAlignment>('center');
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewSrc(objectUrl);
    }
  };

  const handleInsert = async () => {
    let finalUrl = '';

    if (sourceType === 'upload') {
      if (!selectedFile && !imageUrl) {
        alert('Please choose an image file to upload or provide an image URL.');
        return;
      }
      if (selectedFile) {
        try {
          setIsUploading(true);
          // Compress for email friendly payload (max width 800px, 80% quality)
          const optimizedFile = await compressImage(selectedFile, 800, 0.82);
          const uploadedPath = await api.uploadFile(optimizedFile, (pct) => {
            setUploadProgress(pct);
          });
          
          // Ensure absolute URL so all email clients load it
          if (uploadedPath.startsWith('http://') || uploadedPath.startsWith('https://')) {
            finalUrl = uploadedPath;
          } else {
            const host = window.location.origin.includes('localhost') 
              ? 'https://joshuasgeneration.com' 
              : window.location.origin;
            finalUrl = `${host}${uploadedPath.startsWith('/') ? '' : '/'}${uploadedPath}`;
          }
        } catch (err: any) {
          console.error(err);
          alert(err.message || 'Failed to upload photo. Please check your connection and try again.');
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      } else {
        finalUrl = imageUrl.trim();
      }
    } else {
      if (!imageUrl.trim()) {
        alert('Please enter an image URL.');
        return;
      }
      finalUrl = imageUrl.trim();
    }

    // Build responsive, email-compatible HTML snippet
    const safeAlt = (altText.trim() || caption.trim() || 'Photo').replace(/"/g, '&quot;');
    const safeCaption = caption.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    let containerAlign = 'center';
    let imgStyle = 'max-width: 100%; height: auto; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.08);';

    if (alignment === 'left') {
      containerAlign = 'left';
    } else if (alignment === 'right') {
      containerAlign = 'right';
    } else if (alignment === 'full') {
      containerAlign = 'center';
      imgStyle = 'width: 100%; max-width: 100%; height: auto; border-radius: 10px; display: block; box-shadow: 0 4px 12px rgba(0,0,0,0.08);';
    }

    const captionHtml = safeCaption 
      ? `<br /><span style="display: block; font-size: 13px; color: #64748b; margin-top: 6px; font-style: italic; line-height: 1.4;">${safeCaption}</span>` 
      : '';

    const htmlSnippet = `<span style="display: block; text-align: ${containerAlign}; margin: 20px 0;"><img src="${finalUrl}" alt="${safeAlt}" style="${imgStyle}" />${captionHtml}</span>`;

    onInsertPhoto(position, htmlSnippet);
    onClose();
  };

  const isEmerald = themeColor === 'emerald';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-150 flex flex-col max-h-[92vh] overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-150 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              isEmerald ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
            )}>
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Add Photo to Email</h3>
              <p className="text-xs text-gray-500">Insert an image into the header, centre, or foot of your email</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200/60 rounded-xl transition-all cursor-pointer border-none bg-transparent text-gray-400 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
          {/* STEP 1: Position selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              1. Choose Where Photo Appears
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Header */}
              <button
                type="button"
                onClick={() => setPosition('header')}
                className={cn(
                  "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                  position === 'header'
                    ? (isEmerald ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20" : "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20")
                    : "bg-gray-50/60 border-gray-200 hover:bg-gray-100/60"
                )}
              >
                <div className="flex items-center justify-between">
                  <ArrowUpToLine className={cn("w-4 h-4", position === 'header' ? (isEmerald ? "text-emerald-700" : "text-indigo-700") : "text-gray-400")} />
                  {position === 'header' && (
                    <span className={cn("w-2 h-2 rounded-full", isEmerald ? "bg-emerald-600" : "bg-indigo-600")} />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Header Banner</div>
                  <div className="text-[10px] text-gray-500 leading-tight mt-0.5">Top of email (under title)</div>
                </div>
              </button>

              {/* Centre */}
              <button
                type="button"
                onClick={() => setPosition('centre')}
                className={cn(
                  "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                  position === 'centre'
                    ? (isEmerald ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20" : "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20")
                    : "bg-gray-50/60 border-gray-200 hover:bg-gray-100/60"
                )}
              >
                <div className="flex items-center justify-between">
                  <MoveVertical className={cn("w-4 h-4", position === 'centre' ? (isEmerald ? "text-emerald-700" : "text-indigo-700") : "text-gray-400")} />
                  {position === 'centre' && (
                    <span className={cn("w-2 h-2 rounded-full", isEmerald ? "bg-emerald-600" : "bg-indigo-600")} />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Centre / Body</div>
                  <div className="text-[10px] text-gray-500 leading-tight mt-0.5">Middle of text / cursor</div>
                </div>
              </button>

              {/* Foot */}
              <button
                type="button"
                onClick={() => setPosition('foot')}
                className={cn(
                  "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                  position === 'foot'
                    ? (isEmerald ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20" : "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20")
                    : "bg-gray-50/60 border-gray-200 hover:bg-gray-100/60"
                )}
              >
                <div className="flex items-center justify-between">
                  <ArrowDownToLine className={cn("w-4 h-4", position === 'foot' ? (isEmerald ? "text-emerald-700" : "text-indigo-700") : "text-gray-400")} />
                  {position === 'foot' && (
                    <span className={cn("w-2 h-2 rounded-full", isEmerald ? "bg-emerald-600" : "bg-indigo-600")} />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Foot / Bottom</div>
                  <div className="text-[10px] text-gray-500 leading-tight mt-0.5">Before email footer</div>
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: Photo source */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                2. Select Photo
              </label>
              <div className="flex rounded-lg bg-gray-100 p-0.5 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setSourceType('upload')}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all cursor-pointer border-none",
                    sourceType === 'upload' ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-900"
                  )}
                >
                  <Upload className="w-3 h-3 inline mr-1" /> Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType('url')}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all cursor-pointer border-none",
                    sourceType === 'url' ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-900"
                  )}
                >
                  <Link2 className="w-3 h-3 inline mr-1" /> Image Link / URL
                </button>
              </div>
            </div>

            {sourceType === 'upload' ? (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {previewSrc ? (
                  <div className="relative rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 p-2 flex items-center gap-4">
                    <img
                      src={previewSrc}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-xl border border-gray-200 bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-900 truncate">
                        {selectedFile?.name || 'Selected Image'}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : ''}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-gray-250 hover:bg-gray-50 text-gray-700 cursor-pointer"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewSrc('');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-250 rounded-2xl p-6 text-center hover:border-gray-400 bg-gray-50/50 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Upload className="w-7 h-7 mx-auto text-gray-400 mb-2" />
                    <div className="text-xs font-bold text-gray-800">Click to upload photo from your device</div>
                    <div className="text-[11px] text-gray-400 mt-1">Supports JPG, PNG, WebP or GIF (optimized for email)</div>
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-600 font-medium">
                      <span>Uploading & optimizing photo...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-150 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full transition-all duration-200", isEmerald ? "bg-emerald-600" : "bg-indigo-600")}
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="url"
                  placeholder="Paste image URL (e.g. https://... or /api/uploads/...)"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setPreviewSrc(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-255 rounded-xl text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
                />
                {imageUrl && (
                  <div className="rounded-xl border border-gray-200 p-2 bg-gray-50 flex items-center gap-3">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 bg-white"
                      onError={() => {}}
                    />
                    <div className="text-xs text-gray-500 truncate flex-1">{imageUrl}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 3: Alignment & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                Alignment & Width
              </label>
              <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAlignment('center')}
                  className={cn(
                    "py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer border-none",
                    alignment === 'center' ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-900"
                  )}
                  title="Center"
                >
                  <AlignCenter className="w-3.5 h-3.5" /> Center
                </button>
                <button
                  type="button"
                  onClick={() => setAlignment('full')}
                  className={cn(
                    "py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer border-none",
                    alignment === 'full' ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-900"
                  )}
                  title="Full Width"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Full
                </button>
                <button
                  type="button"
                  onClick={() => setAlignment('left')}
                  className={cn(
                    "py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer border-none",
                    alignment === 'left' ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-900"
                  )}
                  title="Left"
                >
                  <AlignLeft className="w-3.5 h-3.5" /> Left
                </button>
                <button
                  type="button"
                  onClick={() => setAlignment('right')}
                  className={cn(
                    "py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer border-none",
                    alignment === 'right' ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-900"
                  )}
                  title="Right"
                >
                  <AlignRight className="w-3.5 h-3.5" /> Right
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                Optional Caption
              </label>
              <input
                type="text"
                placeholder="e.g. Apostolic Gathering in Johannesburg"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-255 rounded-xl text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-150 flex items-center justify-between">
          <div className="text-[11px] text-gray-500">
            Target position: <span className="font-bold text-gray-700 uppercase">{position}</span>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-250 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInsert}
              disabled={isUploading || (!selectedFile && !imageUrl)}
              className={cn(
                "px-5 py-2 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50 border-none transition-all",
                isEmerald 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "bg-indigo-600 hover:bg-indigo-700"
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" /> Insert Photo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
