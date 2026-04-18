'use client';

import React, { useState } from 'react';
import { CloudUpload, AlertCircle, Check, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface ProducerCreditSubmissionProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const forestImageUrl = 'https://www.figma.com/api/mcp/asset/508f6287-5845-4a27-9101-7166c432af78';
const mapPlaceholderUrl = 'https://www.figma.com/api/mcp/asset/84d681fc-ab93-4a16-9459-07c33c9edc8f';

export default function ProducerCreditSubmission({ onSuccess, onClose }: ProducerCreditSubmissionProps) {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    projectName: '',
    creditQuantity: '',
    latitude: '',
    longitude: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInitializeSubmission = async () => {
    if (!formData.projectName || !formData.creditQuantity) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('projectName', formData.projectName);
      data.append('quantity', formData.creditQuantity);
      data.append('latitude', formData.latitude);
      data.append('longitude', formData.longitude);

      if (files.length > 0) {
        data.append('file', files[0]);
      }

      const response = await api.post('/credits/batches', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Success notification
      alert('Submission initialized successfully!');
      onSuccess?.();
      setFormData({ projectName: '', creditQuantity: '', latitude: '', longitude: '' });
      setFiles([]);
    } catch (error: any) {
      console.error('Submission failed:', error);
      alert(error.response?.data?.message || 'Failed to submit batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4fafd] to-white">
      {/* Header */}
      <div className="border-b border-[#e2e9ec] bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#012d1d]">Block Carbon</h1>
            <p className="text-sm text-[#717973]">Producer Command Center</p>
          </div>
          <div className="flex items-center gap-4">
            <input 
              type="text" 
              placeholder="Search records..." 
              className="px-4 py-2 bg-[#f4fafd] border border-[#e2e9ec] rounded-lg text-sm focus:outline-none"
            />
            <button className="px-4 py-2 hover:bg-[#f4fafd] rounded-lg transition">Marketplace</button>
            <button className="px-4 py-2 hover:bg-[#f4fafd] rounded-lg transition">Help Center</button>
            <button 
              onClick={logout}
              className="px-6 py-2 bg-white border border-[#e2e9ec] rounded-lg font-semibold text-[#012d1d] hover:bg-[#f4fafd] transition"
            >
              Sign Out
            </button>
            <div className="w-8 h-8 bg-[#6bfe9c] rounded-full flex items-center justify-center text-xs font-bold text-[#012d1d]">
              0x8d2...f42
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h2 className="text-4xl font-extrabold text-[#012d1d] mb-4">Producer Credit Submission</h2>
          <p className="text-lg text-[#414844] max-w-2xl">
            Register new environmental assets for verification. Ensure all geospatial data
            and ecological certifications are attached for the audit process.
          </p>
        </div>

        {/* Bento Layout Content */}
        <div className="grid grid-cols-12 gap-8">
          {/* Main Form Column - 8 columns */}
          <div className="col-span-8">
            {/* Section - Form Container */}
            <div className="bg-white rounded-2xl border border-[#c1c8c2]/10 shadow-sm p-10 mb-6">
              <div className="space-y-8">
                {/* Form Fields Row 1 */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Project Name */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-[#012d1d] tracking-wider uppercase">
                      Project Name
                    </label>
                    <input
                      type="text"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleInputChange}
                      placeholder="e.g. Amazonian Reforestation Phase II"
                      className="px-4 py-5 bg-[#eef5f7] rounded-lg text-base text-[#717973] placeholder-[#717973]/50 focus:outline-none focus:ring-2 focus:ring-[#6bfe9c]"
                    />
                  </div>

                  {/* Credit Quantity */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-[#012d1d] tracking-wider uppercase">
                      Credit Quantity (tCO2e)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="creditQuantity"
                        value={formData.creditQuantity}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="w-full px-4 py-5 bg-[#eef5f7] rounded-lg text-base text-[#717973] placeholder-[#717973]/50 focus:outline-none focus:ring-2 focus:ring-[#6bfe9c]"
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-[#1b4332]/10 px-2 py-1 rounded text-xs font-semibold text-[#86af99]">
                        METRIC TONS
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Upload Area */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold text-[#012d1d] tracking-wider uppercase">
                    Verification Proofs
                  </label>
                  <div className="border-2 border-dashed border-[#c1c8c2] rounded-2xl p-12 bg-[#eef5f7]/30 flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 bg-[#1b4332]/5 rounded-full flex items-center justify-center">
                      <CloudUpload className="w-8 h-8 text-[#1b4332]/30" />
                    </div>
                    <div className="text-center">
                      <p className="text-base font-semibold text-[#161d1f]">
                        Drag and drop verification documents
                      </p>
                      <p className="text-sm text-[#414844] mt-1">
                        Supported formats: PDF, GeoJSON, TIFF, CSV (Max 100MB)
                      </p>
                    </div>
                    <label className="mt-6">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.geojson,.tif,.tiff,.csv"
                      />
                      <button
                        type="button"
                        onClick={() => document.querySelector('input[type="file"]')?.click()}
                        className="px-6 py-2 bg-white border border-[#c1c8c2] rounded-lg text-sm font-bold text-[#012d1d] hover:bg-[#f4fafd] transition"
                      >
                        Browse Local Files
                      </button>
                    </label>
                  </div>

                  {/* File List */}
                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-[#f9fbfc] border border-[#e2e9ec] rounded-lg"
                        >
                          <span className="text-sm text-[#414844]">{file.name}</span>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-[#717973] hover:text-[#d32f2f] transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Protocol Notice */}
                <div className="bg-[#1b4332]/5 border border-[#1b4332]/10 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-[#13bf66] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-[#13bf66] tracking-wider uppercase mb-1">
                      Protocol Notice
                    </p>
                    <p className="text-sm text-[#13bf66]/80">
                      Submissions are processed as <span className="font-semibold">multipart/form-data</span>. Digital
                      fingerprints of your assets will be anchored to the ledger upon
                      verification. Large geospatial datasets may require additional
                      processing time.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-6 items-center justify-end pt-4 border-t border-[#e2e9ec]">
                  <button
                    onClick={onClose}
                    className="px-6 py-4 text-[#414844] font-bold hover:text-[#012d1d] transition"
                  >
                    Discard Draft
                  </button>
                  <button
                    onClick={handleInitializeSubmission}
                    disabled={loading}
                    className="px-10 py-4 bg-gradient-to-b from-[#012d1d] to-[#1b4332] text-white font-extrabold rounded-2xl shadow-lg shadow-[#1b4332]/20 hover:shadow-xl disabled:opacity-50 transition transform hover:scale-105"
                  >
                    {loading ? 'Processing...' : 'Initialize Submission'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Contextual Sidebar Column - 4 columns */}
          <div className="col-span-4 space-y-8">
            {/* Asset Preview Card */}
            <div className="bg-[#012d1d] rounded-2xl overflow-hidden shadow-xl">
              {/* Image Container */}
              <div className="h-48 relative overflow-hidden">
                <img
                  src={forestImageUrl}
                  alt="Forest Sample"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#012d1d]" />
                <div className="absolute bottom-4 left-6 space-y-2">
                  <div className="bg-[#6bfe9c] text-[#00210c] text-xs font-semibold px-2 py-1 rounded-full w-fit">
                    LIVE PREVIEW
                  </div>
                  <h3 className="text-2xl font-bold text-white">Asset Genesis Preview</h3>
                </div>
              </div>

              {/* Content Container */}
              <div className="p-6 space-y-4">
                {/* Target Basin */}
                <div className="border-b border-white/10 pb-4">
                  <p className="text-xs font-bold text-[#a5d0b9] tracking-wider uppercase mb-1">
                    Target Basin
                  </p>
                  <p className="text-base text-white font-medium">Upper Amazon Basin</p>
                </div>

                {/* Protocol */}
                <div className="border-b border-white/10 pb-4">
                  <p className="text-xs font-bold text-[#a5d0b9] tracking-wider uppercase mb-1">
                    Protocol
                  </p>
                  <p className="text-base text-white font-medium">Verra VM0045</p>
                </div>

                {/* Estimated Gas Fee */}
                <div>
                  <p className="text-xs font-bold text-[#a5d0b9] tracking-wider uppercase mb-1">
                    Est. Gas Fee
                  </p>
                  <p className="text-base text-white font-medium">0.002 ETH</p>
                </div>
              </div>
            </div>

            {/* Compliance Checklist */}
            <div className="bg-[#e8eff1] rounded-2xl p-8">
              <h3 className="text-xl font-bold text-[#012d1d] mb-6">Compliance Checklist</h3>

              <div className="space-y-4">
                {/* Verified Producer Status */}
                <div className="flex gap-3 items-start">
                  <div className="w-5 h-5 bg-[#004621] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-sm font-medium text-[#414844]">Verified Producer Status</p>
                </div>

                {/* Wallet Signature Ready */}
                <div className="flex gap-3 items-start">
                  <div className="w-5 h-5 bg-[#004621] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-sm font-medium text-[#414844]">Wallet Signature Ready</p>
                </div>

                {/* GIS Map Layer */}
                <div className="flex gap-3 items-start">
                  <div className="w-5 h-5 border-2 border-[#c1c8c2] rounded-full flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-[#414844]">GIS Map Layer (Shapefile)</p>
                </div>

                {/* Local Community Consent */}
                <div className="flex gap-3 items-start">
                  <div className="w-5 h-5 border-2 border-[#c1c8c2] rounded-full flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#414844]">Local Community Consent</p>
                    <p className="text-xs text-[#717973]">PDF</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Interaction Placeholder */}
            <div className="bg-[#dde4e6] rounded-2xl h-64 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-40">
                <img
                  src={mapPlaceholderUrl}
                  alt="Map"
                  className="w-full h-full object-cover mix-blend-saturation"
                />
              </div>
              <div className="relative text-center space-y-2">
                <p className="text-sm font-bold text-[#012d1d]">BOUNDARIES NOT SET</p>
                <button className="px-4 py-2 bg-[#012d1d] text-white text-xs font-bold rounded-full hover:bg-[#1b4332] transition">
                  SET PROJECT AREA
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Bar */}
      <div className="border-t border-[#e2e9ec] bg-white sticky bottom-0 py-4 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button className="px-4 py-2 text-[#1b4332] font-semibold hover:text-[#012d1d] transition">
            + Submit Credits
          </button>
          <span className="text-xs text-[#717973]">Last saved 2 minutes ago</span>
        </div>
      </div>
    </div>
  );
}
