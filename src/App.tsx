import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, AlertCircle, Camera, Check, Info, ArrowRight } from 'lucide-react';

interface RecommendedColor {
  name: string;
  hex: string;
  reason: string;
}

interface AnalysisData {
  disclaimer: string;
  summary: string;
  tone_direction: 'warm' | 'cool' | 'neutral';
  season_type: string;
  sub_type: string;
  confidence: number;
  analysis: {
    skin_tone: string;
    brightness: string;
    saturation: string;
    contrast: string;
    overall_impression: string;
  };
  recommended_colors: RecommendedColor[];
  avoid_colors: RecommendedColor[];
  makeup_recommendations: {
    lip: string[];
    blush: string[];
    eyeshadow: string[];
  };
  hair_recommendations: string[];
  fashion_recommendations: string[];
  style_tip: string;
  photo_quality_note: string;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setResults(null);
      setError(null);
    }
  };

  const analyzeImage = async () => {
    if (!preview) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: preview }),
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || '분석에 실패했습니다. 다시 시도해주세요.');
        }
        setResults(data);
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`서버에서 올바르지 않은 응답을 받았습니다 (Status: ${response.status}). 이 문제가 지속되면 관리자에게 문의하세요.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 font-sans bg-neutral-50 text-neutral-900">
      {/* Navigation */}
      <nav className="border-b border-neutral-200 px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">P</div>
          <div>
            <h1 className="text-lg font-bold leading-tight">PERSONAL COLOR</h1>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold">AI Intelligence</p>
          </div>
        </div>
        <div className="hidden md:block max-w-xs text-right">
          <p className="text-[10px] text-neutral-400 leading-tight italic">
            * Analysis based on photo upload. Lighting and camera settings may affect accuracy.
          </p>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-12">
        <header className="mb-12 text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4 tracking-tight">
              당신의 <span className="text-indigo-600">고유한 빛</span>을 찾아서
            </h2>
            <p className="text-neutral-500 text-lg font-medium leading-relaxed">
              최첨단 AI가 당신의 특징을 초정밀 분석하여 최적의 팔레트를 완성합니다.
            </p>
          </motion.div>
        </header>

        {/* Upload Section */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
              relative group cursor-pointer rounded-[2.5rem] border-2 border-dashed transition-all duration-500 overflow-hidden
              ${preview ? 'border-transparent shadow-2xl' : 'border-neutral-200 hover:border-indigo-400 bg-white shadow-sm'}
            `}
            onClick={() => !loading && fileInputRef.current?.click()}
          >
            {preview ? (
              <div className="relative aspect-[3/4] md:aspect-video w-full overflow-hidden">
                <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white text-neutral-900 px-6 py-3 rounded-full flex items-center gap-2 font-bold text-sm shadow-xl">
                    <Camera size={18} />
                    사진 변경하기
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-[3/4] md:aspect-video flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <Upload className="text-indigo-600" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">얼굴 사진을 업로드하세요</h3>
                <p className="text-neutral-400 text-sm max-w-xs mx-auto">
                  조명이 밝고 배경이 단순한 정면 사진이 정밀한 분석을 돕습니다.
                </p>
              </div>
            )}
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
            />
          </motion.div>

          <AnimatePresence>
            {preview && !results && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-8 flex justify-center"
              >
                <button
                  onClick={analyzeImage}
                  disabled={loading}
                  className="bg-indigo-600 text-white px-12 py-4 rounded-full font-bold flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      AI 전문가 분석 중...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      퍼스널 컬러 정밀 분석
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 max-w-md mx-auto"
            >
              <AlertCircle size={20} />
              <p className="text-sm font-semibold">{error}</p>
            </motion.div>
          )}
        </section>

        {/* Results Section - Bento Grid */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-4 min-h-[800px]"
            >
              {/* Main Result Card */}
              <div className="col-span-1 md:col-span-7 md:row-span-3 bg-white border border-neutral-200 rounded-[2.5rem] p-10 flex flex-col justify-center relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-8">
                  <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-100">
                    {results.sub_type}
                  </span>
                </div>
                <div className="z-10">
                  <p className="text-neutral-500 font-semibold mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                    당신을 위한 정밀 진단 결과
                  </p>
                  <h2 className="text-5xl md:text-7xl font-black text-neutral-800 tracking-tighter mb-6">
                    {results.season_type.split(' ')[0]} <span className="text-indigo-600 underline decoration-indigo-100 underline-offset-8">{results.season_type.split(' ')[1]}</span>
                  </h2>
                  <div className="h-1.5 w-24 bg-indigo-600 rounded-full mb-8"></div>
                  <p className="text-2xl font-bold text-neutral-700 leading-tight italic">
                    "{results.summary}"
                  </p>
                </div>
                <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-indigo-50 rounded-full blur-[100px] opacity-60" />
              </div>

              {/* Facial Metrics Card */}
              <div className="col-span-1 md:col-span-5 md:row-span-2 bg-neutral-900 text-white rounded-[2.5rem] p-8 flex flex-col justify-between shadow-xl">
                <div className="flex justify-between items-start">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Facial Metrics</h3>
                  <span className="text-[10px] bg-neutral-800 px-3 py-1 rounded-full text-neutral-300 font-bold tracking-tight">
                    Confidence: {results.confidence || 92}%
                  </span>
                </div>
                <div className="space-y-4 mt-8">
                  {[
                    { label: 'Skin Tone', value: results.analysis.skin_tone },
                    { label: 'Brightness', value: results.analysis.brightness },
                    { label: 'Saturation', value: results.analysis.saturation }
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between border-b border-neutral-800 pb-3">
                      <span className="text-sm font-medium text-neutral-500">{item.label}</span>
                      <span className="text-sm font-bold truncate max-w-[180px] text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Impression Card */}
              <div className="col-span-1 md:col-span-5 md:row-span-1 bg-white border border-neutral-200 rounded-[2.5rem] p-6 flex items-center gap-5 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Overall Impression</h4>
                  <p className="text-base font-bold leading-tight">{results.analysis.overall_impression}</p>
                </div>
              </div>

              {/* Recommended Palette */}
              <div className="col-span-1 md:col-span-6 md:row-span-3 bg-white border border-neutral-200 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-neutral-800">Best Palette</h3>
                  <span className="text-[10px] text-neutral-400 font-bold italic">정밀 추천 컬러 8선</span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {results.recommended_colors.slice(0, 8).map((color, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      <div 
                        className="aspect-[3/4] rounded-2xl shadow-inner border border-black/5 hover:scale-105 transition-transform"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-[9px] text-center font-bold text-neutral-500 uppercase tracking-tighter truncate px-1">
                        {color.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avoid Colors */}
              <div className="col-span-1 md:col-span-3 md:row-span-3 bg-red-50/30 border border-red-100 rounded-[2.5rem] p-8 shadow-sm">
                <h3 className="text-sm font-black text-red-800 uppercase tracking-widest mb-6">Avoid These</h3>
                <div className="space-y-4">
                  {results.avoid_colors.slice(0, 5).map((color, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-full border-2 border-white shadow-md shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-xs font-bold text-red-900 leading-tight">
                        {color.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Styling Tips */}
              <div className="col-span-1 md:col-span-3 md:row-span-3 bg-white border border-neutral-200 rounded-[2.5rem] p-8 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-800 mb-6 font-bold">Styling Guide</h3>
                <div className="space-y-6">
                  <div>
                    <span className="text-[9px] text-neutral-400 uppercase font-black block mb-2 tracking-widest">Makeup</span>
                    <div className="flex gap-2 flex-wrap text-sm">
                      <span className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-bold">Lip: {results.makeup_recommendations.lip[0]}</span>
                      <span className="px-2.5 py-1.5 bg-indigo-50/50 text-indigo-600 rounded-xl text-[10px] font-bold">Blush: {results.makeup_recommendations.blush[0]}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-400 uppercase font-black block mb-2 tracking-widest">Hair</span>
                    <p className="text-xs font-bold text-neutral-700">{results.hair_recommendations[0]}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-400 uppercase font-black block mb-2 tracking-widest">Fashion</span>
                    <p className="text-xs text-neutral-600 leading-relaxed font-medium">{results.fashion_recommendations[0]}</p>
                  </div>
                </div>
              </div>

              {/* Reset Area */}
              <div className="col-span-1 md:col-span-12 mt-12 flex flex-col items-center gap-6">
                <p className="text-[10px] text-neutral-400 text-center max-w-lg italic px-4 leading-relaxed">
                  {results.disclaimer}
                </p>
                <div className="h-px w-24 bg-neutral-200" />
                <button
                  onClick={() => {
                    setResults(null);
                    setPreview(null);
                    setFile(null);
                  }}
                  className="group flex items-center gap-3 text-indigo-600 font-black text-sm uppercase tracking-[0.2em] hover:text-indigo-700 transition-all border-b-2 border-transparent hover:border-indigo-700 pb-1"
                >
                  New Analysis
                  <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
