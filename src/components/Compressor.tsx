import { useState, useRef, useCallback } from 'react';
import { formatBytes } from '@/types';
import {
  X, Upload, Download, FileImage, Loader2, Zap, Target, Check,
  Image as ImageIcon, FileText, Sparkles
} from 'lucide-react';

interface CompressorProps {
  onClose?: () => void;
}

type TargetUnit = 'KB' | 'MB';

interface CompressionResult {
  blob: Blob;
  url: string;
  originalSize: number;
  compressedSize: number;
  name: string;
  type: string;
}

export default function Compressor({ onClose }: CompressorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [targetSize, setTargetSize] = useState<number>(500);
  const [targetUnit, setTargetUnit] = useState<TargetUnit>('KB');
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetBytes = targetSize * (targetUnit === 'MB' ? 1024 * 1024 : 1024);

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/') && selectedFile.type !== 'application/pdf') {
      setError('Please select an image file (JPG, PNG, WebP, GIF)');
      return;
    }

    setError(null);
    setResult(null);
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const compressImage = useCallback(async (
    imgFile: File,
    target: number
  ): Promise<CompressionResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas not supported'));
            return;
          }
          ctx.drawImage(img, 0, 0);

          const isPng = imgFile.type === 'image/png';
          const isWebp = imgFile.type === 'image/webp';

          // Try quality levels from high to low
          let low = 0.1;
          let high = 1.0;
          let bestBlob: Blob | null = null;
          let bestUrl = '';
          const mimeType = isPng ? 'image/jpeg' : isWebp ? 'image/webp' : imgFile.type;

          const tryQuality = (quality: number): Promise<Blob> => {
            return new Promise((res, rej) => {
              canvas.toBlob((blob) => {
                if (blob) res(blob);
                else rej(new Error('Compression failed'));
              }, mimeType, quality);
            });
          };

          // Binary search for best quality that fits under target
          const findBest = async () => {
            for (let i = 0; i < 10; i++) {
              const mid = (low + high) / 2;
              const blob = await tryQuality(mid);

              if (blob.size <= target) {
                bestBlob = blob;
                bestUrl = URL.createObjectURL(blob);
                low = mid;
              } else {
                high = mid;
              }
            }

            // If even lowest quality doesn't fit, try reducing dimensions
            if (!bestBlob) {
              let scale = 0.9;
              while (scale > 0.1 && !bestBlob) {
                const scaledCanvas = document.createElement('canvas');
                scaledCanvas.width = Math.floor(img.naturalWidth * scale);
                scaledCanvas.height = Math.floor(img.naturalHeight * scale);
                const scaledCtx = scaledCanvas.getContext('2d');
                if (!scaledCtx) break;
                scaledCtx.drawImage(img, 0, 0, scaledCanvas.width, scaledCanvas.height);

                for (let q = 0.1; q <= 1.0; q += 0.1) {
                  const blob = await new Promise<Blob | null>((res) =>
                    scaledCanvas.toBlob(res, mimeType, q)
                  );
                  if (blob && blob.size <= target) {
                    bestBlob = blob;
                    bestUrl = URL.createObjectURL(blob);
                    break;
                  }
                }
                scale -= 0.1;
              }
            }

            if (!bestBlob) {
              // Last resort: use the smallest we got
              const blob = await tryQuality(0.1);
              bestBlob = blob;
              bestUrl = URL.createObjectURL(blob);
            }

            const nameWithoutExt = imgFile.name.replace(/\.[^/.]+$/, '');
            const newExt = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png';
            const newName = `${nameWithoutExt}_compressed.${newExt}`;

            resolve({
              blob: bestBlob!,
              url: bestUrl,
              originalSize: imgFile.size,
              compressedSize: bestBlob!.size,
              name: newName,
              type: mimeType,
            });
          };

          findBest().catch(reject);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(imgFile);
    });
  }, []);

  const handleCompress = async () => {
    if (!file) return;
    setCompressing(true);
    setError(null);

    try {
      if (file.type.startsWith('image/')) {
        const res = await compressImage(file, targetBytes);
        setResult(res);
      } else {
        setError('Only image files can be compressed in the browser');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed');
    } finally {
      setCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const savings = result
    ? Math.round((1 - result.compressedSize / result.originalSize) * 100)
    : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Document Compressor</h2>
              <p className="text-sm text-slate-400">Compress images to your target file size</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl flex items-center justify-center">
                  <FileImage className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Drop an image here or click to browse</p>
                  <p className="text-sm text-slate-400 mt-1">JPG, PNG, WebP, GIF supported</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />
            </div>
          ) : (
            <>
              {/* Selected file */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-sm text-slate-400">{formatBytes(file.size)}</p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Target size selector */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  Target file size
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={targetSize}
                    onChange={(e) => setTargetSize(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    className="w-32 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <div className="flex gap-2">
                    {(['KB', 'MB'] as TargetUnit[]).map((unit) => (
                      <button
                        key={unit}
                        onClick={() => setTargetUnit(unit)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                          targetUnit === unit
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-slate-400 self-center">Quick presets:</span>
                {[
                  { label: '100 KB', size: 100, unit: 'KB' as TargetUnit },
                  { label: '500 KB', size: 500, unit: 'KB' as TargetUnit },
                  { label: '1 MB', size: 1, unit: 'MB' as TargetUnit },
                  { label: '2 MB', size: 2, unit: 'MB' as TargetUnit },
                  { label: '5 MB', size: 5, unit: 'MB' as TargetUnit },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => { setTargetSize(preset.size); setTargetUnit(preset.unit); }}
                    className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {/* Compress button */}
              {!result && (
                <button
                  onClick={handleCompress}
                  disabled={compressing}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                >
                  {compressing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Compressing… Finding optimal quality
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Compress to {targetSize} {targetUnit}
                    </>
                  )}
                </button>
              )}

              {/* Result */}
              {result && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <Check className="w-5 h-5" />
                    Compression complete!
                  </div>

                  {/* Before / After */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Before</p>
                      <p className="text-2xl font-bold text-slate-700">{formatBytes(result.originalSize)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <p className="text-xs text-emerald-500 uppercase tracking-wide font-semibold mb-1">After</p>
                      <p className="text-2xl font-bold text-emerald-600">{formatBytes(result.compressedSize)}</p>
                    </div>
                  </div>

                  {/* Savings */}
                  <div className="text-center">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                      <Zap className="w-4 h-4" />
                      {savings > 0 ? `${savings}% smaller` : 'Optimized'}
                    </span>
                  </div>

                  {/* Preview */}
                  <div className="bg-white rounded-lg p-3 flex items-center gap-3">
                    <img src={result.url} alt="Preview" className="w-16 h-16 object-cover rounded-md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{result.name}</p>
                      <p className="text-xs text-slate-400">{formatBytes(result.compressedSize)}</p>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>

                  <button
                    onClick={handleReset}
                    className="w-full py-2.5 text-slate-600 font-medium hover:text-slate-800 transition-colors text-sm"
                  >
                    Compress another file
                  </button>
                </div>
              )}
            </>
          )}

          {/* Info card */}
          {!file && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">How it works</p>
                  <p className="text-blue-700 leading-relaxed">
                    Set your target file size and the compressor will automatically find the best
                    quality-to-size ratio. Perfect for meeting upload size limits on application forms,
                    scholarship portals, and email attachments.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
