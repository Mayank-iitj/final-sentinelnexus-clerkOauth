"use client";

import { useState, useRef } from "react";
import { AppShell } from "../../../components/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { scanDeepfake } from "../../../lib/api";
import '../../../components/DeepfakeEffects.css';

export default function DeepfakePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{ verdict: string; confidence: number; meta: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.type.startsWith("image/")) {
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setResult(null);
        setError(null);
      } else {
        setError("Please drop a valid image file.");
      }
    }
  };

  const startScan = async () => {
    if (!file) return;
    
    setIsScanning(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await scanDeepfake(formData);
      setResult({
        verdict: data.verdict,
        confidence: data.confidence_score,
        meta: data.meta
      });
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-8 font-mono text-[#0F0]">
        
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold flex items-center gap-2 uppercase tracking-widest">
            <span className="text-violet-500">●</span> DeepFake Forensic Analysis
          </h1>
          <p className="text-xs text-[#0F0]/50 mt-1 uppercase">Powered by Vision Transformers (ViT). Open-Source Verification.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          
          {/* Upload Section */}
          <div className="flex flex-col gap-4">
            <div 
              className={`border-2 border-dashed transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[400px] relative
                ${isScanning ? "border-violet-500 bg-violet-900/10 pointer-events-none" : "border-[#0F0]/30 hover:border-[#0F0] bg-black/50"}
                ${previewUrl ? "p-2" : "p-8"}
              `}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !isScanning && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />

              {previewUrl ? (
                <div className="w-full h-full relative deepfake-scanner rounded-lg">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-lg opacity-80" />
                  {isScanning && (
                    <>
                      <div className="scan-line" />
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
                      <div className="absolute top-4 left-4 text-xs bg-black/80 px-2 py-1 text-violet-400 font-bold glitch-text">
                        ANALYZING TENSORS...
                      </div>
                    </>
                  )}
                  {result && (
                    <div className="absolute inset-0 ring-4 ring-inset rounded-lg pointer-events-none" 
                         style={{ borderColor: result.verdict === 'FAKE' ? '#ef4444' : '#10b981' }} />
                  )}
                </div>
              ) : (
                <div className="text-[#0F0]/50">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                  </svg>
                  <p className="text-sm font-bold uppercase tracking-widest">Select Image or Drag & Drop</p>
                  <p className="text-xs mt-2">JPG, PNG up to 10MB</p>
                </div>
              )}
            </div>
            
            <button
              onClick={startScan}
              disabled={!file || isScanning}
              className={`w-full py-4 text-sm font-bold tracking-widest uppercase transition-colors border
                ${isScanning 
                  ? "border-violet-500 text-violet-500 bg-transparent animate-pulse" 
                  : !file 
                    ? "border-gray-800 text-gray-600 bg-transparent cursor-not-allowed" 
                    : "border-[#0F0] text-black bg-[#0F0] hover:bg-transparent hover:text-[#0F0]"
                }
              `}
            >
              {isScanning ? "[ Executing ViT Inference... ]" : "[ Run Forensic Scan ]"}
            </button>
            
            {error && (
              <div className="text-red-500 text-xs text-center uppercase p-2 bg-red-500/10 border border-red-500/20">
                [ ERROR: {error} ]
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="flex flex-col h-full border border-[#0F0]/30 bg-black/90 p-1">
             <div className="bg-[#0F0]/10 text-xs px-2 py-1 border-b border-[#0F0]/30 uppercase font-bold flex justify-between">
                <span>ANALYSIS_REPORT</span>
                {isScanning && <span className="text-violet-400 animate-pulse">PROCESSING...</span>}
             </div>
             
             <div className="p-6 flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                {!result && !isScanning && (
                   <p className="text-[#0F0]/30 text-xs uppercase tracking-widest text-center">
                     Waiting for image tensor input.<br/>Hugging Face ViT Engine Idle.
                   </p>
                )}
                
                {isScanning && (
                  <div className="w-full space-y-4 max-w-xs">
                     <div className="flex justify-between text-xs"><span>Loading weights...</span><span>OK</span></div>
                     <div className="flex justify-between text-xs"><span>Extracting features...</span><span>OK</span></div>
                     <div className="flex justify-between text-xs text-violet-400"><span>Running classification...</span><span className="animate-pulse">WORKING</span></div>
                     <div className="h-1 w-full bg-gray-900 overflow-hidden"><div className="h-full bg-violet-500 animate-pulse" style={{width: '60%'}}></div></div>
                  </div>
                )}

                {result && (
                  <AnimatePresence>
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-full flex flex-col items-center"
                    >
                      <h2 className="text-sm uppercase tracking-widest text-gray-400 mb-2">Final Verdict</h2>
                      <div className={`text-6xl font-bold tracking-tighter mb-2 ${result.verdict === 'FAKE' ? 'text-red-500' : 'text-emerald-500'}`}>
                        {result.verdict}
                      </div>
                      
                      <div className="text-xl mb-8 flex items-baseline gap-2">
                        <span>{result.confidence.toFixed(2)}%</span>
                        <span className="text-xs text-gray-500 uppercase tracking-widest">Confidence</span>
                      </div>
                      
                      <div className="w-full border-t border-[#0F0]/20 pt-4 text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Execution Time</span>
                          <span>{result.meta.duration_ms}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Model Framework</span>
                          <span>PyTorch / HuggingFace</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Architecture</span>
                          <span className="text-violet-400">{result.meta.model}</span>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
             </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
