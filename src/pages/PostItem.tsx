import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, Tag, Type, Image as ImageIcon, Loader2, Edit3, Sparkles, Camera, Image as GalleryIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const CATEGORIES = ['Electronics', 'Documents', 'Books', 'Clothing', 'Keys', 'Wallets', 'Others'];

// Map COCO-SSD labels → our categories
const LABEL_TO_CATEGORY: Record<string, string> = {
  cell_phone: 'Electronics', laptop: 'Electronics', keyboard: 'Electronics',
  mouse: 'Electronics', remote: 'Electronics', tv: 'Electronics',
  clock: 'Electronics', headphones: 'Electronics',
  book: 'Books', 
  handbag: 'Wallets', backpack: 'Clothing', suitcase: 'Clothing',
  tie: 'Clothing', umbrella: 'Clothing', 
  scissors: 'Others', bottle: 'Others', cup: 'Others',
};

function getLabelCategory(label: string): string {
  const lower = label.toLowerCase().replace(/ /g, '_');
  return LABEL_TO_CATEGORY[lower] || 'Others';
}

// Format COCO label for display
function formatLabel(label: string): string {
  return label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

interface DetectedBox {
  label: string;
  score: number;
  // pixel coords relative to video natural size
  x: number; y: number; width: number; height: number;
}

export default function PostItem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    location: '',
    type: 'lost' as 'lost' | 'found'
  });
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [detectedBoxes, setDetectedBoxes] = useState<DetectedBox[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const animFrameRef = useRef<number>(0);

  // Load TF model once
  useEffect(() => {
    setModelLoading(true);
    cocoSsd.load().then(model => {
      modelRef.current = model;
      setModelLoading(false);
      console.log('[TF] COCO-SSD model loaded');
    }).catch(err => {
      console.error('[TF] Model load error:', err);
      setModelLoading(false);
    });
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(newStream);
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      }, 100);
    } catch (err) {
      toast.error("Could not access camera. Please check permissions.");
      console.error(err);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsCameraOpen(false);
    setDetectedBoxes([]);
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [stream]);

  // Run detection loop using requestAnimationFrame when camera is open
  useEffect(() => {
    if (!isCameraOpen || !stream) return;

    let lastDetect = 0;

    const detect = async (timestamp: number) => {
      const video = videoRef.current;
      const model = modelRef.current;

      // Run detection every 500ms
      if (model && video && video.readyState === 4 && timestamp - lastDetect > 500) {
        lastDetect = timestamp;
        try {
          const predictions = await model.detect(video);
          // Filter out 'person' — we only want objects, not humans
          const objects = predictions.filter(p => p.class !== 'person');

          if (objects.length > 0) {
            const boxes: DetectedBox[] = objects.map(p => ({
              label: p.class,
              score: p.score,
              x: p.bbox[0],
              y: p.bbox[1],
              width: p.bbox[2],
              height: p.bbox[3],
            }));
            setDetectedBoxes(boxes);

            // Auto-fill form with highest-confidence detection
            const best = objects.reduce((a, b) => a.score > b.score ? a : b);
            const label = formatLabel(best.class);
            const category = getLabelCategory(best.class);
            setFormData(prev => ({
              ...prev,
              title: prev.title || label,
              category,
              description: prev.description || `${label} detected by AI camera. Confidence: ${Math.round(best.score * 100)}%.`,
            }));
          } else {
            setDetectedBoxes([]);
          }
        } catch (e) {
          // silent
        }
      }

      animFrameRef.current = requestAnimationFrame(detect);
    };

    animFrameRef.current = requestAnimationFrame(detect);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isCameraOpen, stream]);

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 1200;
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', { type: 'image/webp', lastModified: Date.now() }));
          } else {
            resolve(file);
          }
        }, 'image/webp', 0.8);
      };
      img.onerror = () => resolve(file);
    });
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("You must be logged in to use AI analysis.");
      setIsAnalyzing(false);
      return;
    }

    const data = new FormData();
    data.append('image', file);
    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const analysis = await res.json();
        setFormData(prev => ({
          ...prev,
          title: analysis.title || prev.title,
          description: analysis.description || prev.description,
          category: analysis.category || prev.category
        }));
        toast.success("AI has automatically identified the item!");
      } else {
        // Safe error extraction
        let errorMessage = "Failed to analyze image";
        try {
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            const textError = await res.text();
            errorMessage = textError || errorMessage;
          }
        } catch (e) { /* ignore */ }
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("[AI Analysis Error]", err);
      toast.error(err.message || "Something went wrong during AI analysis. You can still fill the form manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const takePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const compressedFile = await compressImage(file);
          setImage(compressedFile);
          setPreview(URL.createObjectURL(compressedFile));
          stopCamera();
          analyzeImage(compressedFile);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.type === 'found' && !image) {
      toast.error('A photo is mandatory for found items to help identification.');
      return;
    }
    setLoading(true);
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value as string));
    if (image) data.append('image', image);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: data
      });
      if (res.ok) navigate('/listings');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } },
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-2xl relative">
          {(loading || isAnalyzing) && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-4">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
              />
              <p className="text-primary font-bold animate-pulse text-sm">
                {isAnalyzing ? "AI is describing the item..." : "Publishing Listing..."}
              </p>
            </div>
          )}
          <div className="p-8 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 text-center"
            >
              <div className="inline-flex p-3 rounded-2xl bg-orange-500/10 text-orange-600 mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-card-foreground">Report an Item</h1>
              <p className="text-muted-foreground">Provide as many details as possible to help others identify it.</p>
            </motion.div>

            <motion.form 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
              <motion.div variants={itemVariants} className="flex p-1 bg-muted rounded-2xl relative">
                <button type="button" onClick={() => setFormData({ ...formData, type: 'lost' })}
                  className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all relative z-10", formData.type === 'lost' ? "text-red-600" : "text-muted-foreground")}>
                  LOST
                </button>
                <button type="button" onClick={() => setFormData({ ...formData, type: 'found' })}
                  className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all relative z-10", formData.type === 'found' ? "text-green-600" : "text-muted-foreground")}>
                  FOUND
                </button>
                <motion.div layoutId="type-bg" initial={false}
                  animate={{ x: formData.type === 'lost' ? 0 : '100%' }}
                  className="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-background shadow-lg rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </motion.div>

              <div className="space-y-4">
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-sm font-bold flex items-center text-foreground"><Package className="w-4 h-4 mr-2 text-orange-500" /> Item Title</label>
                  <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-4 bg-secondary border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                    placeholder="e.g. Blue Backpack, iPhone 13" />
                </motion.div>

                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center text-foreground"><Tag className="w-4 h-4 mr-2 text-orange-500" /> Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-4 bg-secondary border border-border rounded-2xl outline-none text-foreground appearance-none">
                      {CATEGORIES.map(c => <option key={c} value={c} className="bg-background">{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center text-foreground"><MapPin className="w-4 h-4 mr-2 text-orange-500" /> Location</label>
                    <input required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full p-4 bg-secondary border border-border rounded-2xl outline-none text-foreground"
                      placeholder="e.g. Library, Cafeteria" />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-sm font-bold flex items-center text-foreground"><Edit3 className="w-4 h-4 mr-2 text-orange-500" /> Description</label>
                  <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-4 bg-secondary border border-border rounded-2xl h-32 outline-none text-foreground resize-none"
                    placeholder="Describe the item, including any unique marks or features..." />
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-sm font-bold flex items-center text-foreground">
                    <ImageIcon className="w-4 h-4 mr-2 text-orange-500" /> 
                    Photo {formData.type === 'found' && <span className="ml-1 text-red-500 font-black">* (Required)</span>}
                  </label>
                  
                  <div className="space-y-4">
                    {preview ? (
                      <div className="relative aspect-video rounded-3xl overflow-hidden border border-border shadow-2xl group">
                        <img src={preview} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setImage(null); setPreview(''); }}
                          className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={startCamera}
                          className="flex flex-col items-center justify-center p-8 bg-orange-500/10 border-2 border-dashed border-orange-500/30 rounded-3xl hover:bg-orange-500/20 transition-all group/cam">
                          <Camera className="w-8 h-8 text-orange-600 mb-2 group-hover/cam:scale-110 transition-transform" />
                          <span className="text-xs font-black uppercase tracking-widest text-orange-600">Take Photo</span>
                          {modelLoading && <span className="text-[10px] text-orange-400 mt-1">Loading AI...</span>}
                        </motion.button>

                        <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => document.getElementById('gallery-upload')?.click()}
                          className="flex flex-col items-center justify-center p-8 bg-secondary border-2 border-dashed border-border rounded-3xl hover:bg-muted transition-all group/gal">
                          <GalleryIcon className="w-8 h-8 text-muted-foreground/30 mb-2 group-hover/gal:scale-110 transition-transform" />
                          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Gallery</span>
                        </motion.button>
                      </div>
                    )}
                  </div>

                  <input id="gallery-upload" type="file" className="hidden" accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const compressedFile = await compressImage(file);
                        setImage(compressedFile);
                        setPreview(URL.createObjectURL(compressedFile));
                        analyzeImage(compressedFile);
                      }
                    }} />
                </motion.div>
              </div>

              <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all flex items-center justify-center disabled:opacity-50 shadow-xl shadow-primary/20">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (<><Sparkles className="w-4 h-4 mr-2" />Publish Listing</>)}
              </motion.button>
            </motion.form>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isCameraOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
          >
            {/* Header */}
            <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
              <button onClick={stopCamera}
                className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all">
                <X className="w-6 h-6" />
              </button>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                {modelLoading ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Loading AI Model...</>
                ) : detectedBoxes.length > 0 ? (
                  <><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" /> AI Detecting</>
                ) : (
                  'Live Viewfinder'
                )}
              </div>
              <div className="w-12 h-12" />
            </div>

            {/* Video + Overlay Container */}
            <div ref={overlayRef} className="relative w-full h-full max-w-2xl aspect-[3/4] md:aspect-video flex items-center justify-center overflow-hidden md:rounded-[3rem]">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

              {/* Corner brackets */}
              <div className="absolute inset-12 border-2 border-white/20 rounded-[2rem] pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-2xl" />
              </div>

              {/* TF.js Bounding Boxes — positioned relative to the video element via percentage */}
              {detectedBoxes.map((box, i) => {
                const video = videoRef.current;
                if (!video || video.videoWidth === 0) return null;
                const vw = video.videoWidth;
                const vh = video.videoHeight;
                const left = (box.x / vw) * 100;
                const top = (box.y / vh) * 100;
                const width = (box.width / vw) * 100;
                const height = (box.height / vh) * 100;
                const confidence = Math.round(box.score * 100);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                      boxShadow: '0 0 20px rgba(74, 222, 128, 0.6), inset 0 0 20px rgba(74,222,128,0.05)',
                    }}
                    className="absolute border-2 border-green-400 rounded-lg pointer-events-none z-20"
                  >
                    {/* Label pill */}
                    <div className="absolute -top-9 left-0 flex items-center bg-green-500 text-white text-[11px] font-black uppercase tracking-widest rounded-full px-3 py-1 gap-1 whitespace-nowrap shadow-lg"
                      style={{ boxShadow: '0 0 10px rgba(74,222,128,0.8)' }}>
                      <Sparkles className="w-3 h-3" />
                      {formatLabel(box.label)} · {confidence}%
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom: capture button */}
            <div className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-8">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                {detectedBoxes.length > 0 ? `${detectedBoxes.length} item(s) detected · tap to capture` : 'Center your item in the frame'}
              </p>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={takePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1">
                <div className="w-full h-full bg-white rounded-full" />
              </motion.button>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
