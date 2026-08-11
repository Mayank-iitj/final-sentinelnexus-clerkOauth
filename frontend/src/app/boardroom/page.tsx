"use client";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function BoardroomPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      // Add a small delay to ensure all animations are settled
      await new Promise((resolve) => setTimeout(resolve, 300));
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#020617', // Match dark slate-950 theme
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      // Calculate height to perfectly maintain aspect ratio
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Add margins (10mm on each side, top/bottom)
      const margin = 10;
      const usableWidth = pdfWidth - margin * 2;
      const usableHeight = (canvas.height * usableWidth) / canvas.width;

      // Dark background for the PDF margins
      pdf.setFillColor(2, 6, 23);
      pdf.rect(0, 0, pdfWidth, pdf.internal.pageSize.getHeight(), 'F');

      pdf.addImage(imgData, 'PNG', margin, margin, usableWidth, usableHeight);
      pdf.save(`Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-8" ref={reportRef}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-violet-500">❖</span> Executive Boardroom
            </h1>
            <p className="text-sm text-gray-500 mt-1">High-level metrics, ROI, and compliance posture for C-suite.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50"
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            {isExporting ? "Generating PDF..." : "Export PDF Report"}
          </motion.button>
        </motion.div>
        
        
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Cyber ROI</div>
            <div className="text-3xl font-bold tracking-tight text-emerald-400 mt-1">+240%</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Breach Probability</div>
            <div className="text-3xl font-bold tracking-tight text-emerald-400 mt-1">1.2%</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Compliance Readiness</div>
            <div className="text-3xl font-bold tracking-tight text-violet-400 mt-1">100%</div>
          </motion.div>
        </motion.div>


        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01] mt-6 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs text-gray-500">
                  <th className="pb-3 font-medium">Metric</th>
                  <th className="pb-3 font-medium">Current Quarter</th>
                  <th className="pb-3 font-medium">Previous Quarter</th>
                  <th className="pb-3 font-medium">Trend</th>

                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 border-b border-white/[0.02]">Mean Time to Detect (MTTD)</td>
                  <td className="py-3 border-b border-white/[0.02]">2 mins</td>
                  <td className="py-3 border-b border-white/[0.02]">14 mins</td>
                  <td className="py-3 border-b border-white/[0.02]">Improved (85%)</td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 border-b border-white/[0.02]">Incidents Escalated</td>
                  <td className="py-3 border-b border-white/[0.02]">0</td>
                  <td className="py-3 border-b border-white/[0.02]">2</td>
                  <td className="py-3 border-b border-white/[0.02]">Improved (100%)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>


      </div>
    </AppShell>
  );
}
