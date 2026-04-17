'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ShieldCheck, MapPin, Activity } from 'lucide-react';
import api from '@/lib/api';

interface BatchSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BatchSubmissionModal({ isOpen, onClose, onSuccess }: BatchSubmissionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: '',
    latitude: '',
    longitude: '',
    projectType: 'Reforestation',
    description: '',
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('quantity', formData.quantity);
      data.append('metadata', JSON.stringify({
        latitude: formData.latitude,
        longitude: formData.longitude,
        projectType: formData.projectType,
        description: formData.description,
      }));
      if (file) {
        data.append('file', file);
      }

      await api.post('/credits/batches', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Failed to submit batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#012d1d] p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#6bfe9c]/20 rounded-lg">
                  <ShieldCheck className="w-6 h-6 text-[#6bfe9c]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">New Batch Submission</h2>
                  <p className="text-[#a8b0ad] text-xs">Verified Ecological Credit Registration</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#414844] uppercase flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Quantity (tCO2e)
                  </label>
                  <input
                    required
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full px-4 py-3 bg-[#f9fbfc] border border-[#e2e9ec] rounded-xl focus:border-[#6bfe9c] focus:outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#414844] uppercase flex items-center gap-1">
                    Project Type
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="w-full px-4 py-3 bg-[#f9fbfc] border border-[#e2e9ec] rounded-xl focus:border-[#6bfe9c] focus:outline-none transition"
                  >
                    <option>Reforestation</option>
                    <option>Blue Carbon</option>
                    <option>Renewable Energy</option>
                    <option>Methane Capture</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#414844] uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Latitude
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="e.g. -3.4653"
                    className="w-full px-4 py-3 bg-[#f9fbfc] border border-[#e2e9ec] rounded-xl focus:border-[#6bfe9c] focus:outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#414844] uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Longitude
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="e.g. -62.2159"
                    className="w-full px-4 py-3 bg-[#f9fbfc] border border-[#e2e9ec] rounded-xl focus:border-[#6bfe9c] focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-xs font-bold text-[#414844] uppercase">Evidence & Proof of Impact (PDF/ZIP)</label>
                <div 
                  className={`border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                    file ? 'border-[#6bfe9c] bg-[#f0fff4]' : 'border-[#e2e9ec] hover:border-[#6bfe9c] bg-[#f9fbfc]'
                  }`}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input 
                    id="file-upload"
                    type="file" 
                    className="hidden" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <div className={`p-4 rounded-full ${file ? 'bg-[#6bfe9c]/20 text-[#1b4332]' : 'bg-white text-[#ccd4d8]'}`}>
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-[#012d1d]">{file ? file.name : 'Click to upload files'}</p>
                    <p className="text-[#a8b0ad] text-xs">Maximum size 50MB. Verified by external auditors.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 border border-[#e2e9ec] text-[#012d1d] rounded-xl font-bold hover:bg-[#f9fbfc] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] px-6 py-4 bg-[#6bfe9c] text-[#012d1d] rounded-xl font-bold shadow-lg shadow-[#6bfe9c]/20 hover:bg-[#5ae88a] hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
                >
                  {loading ? 'Processing Submission...' : 'Publish to Registry'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
