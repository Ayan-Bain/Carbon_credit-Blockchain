'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ShieldAlert, Cpu } from 'lucide-react';

export type TransactionStatus = 'pending' | 'success' | 'error' | 'security_mismatch' | 'beyond_repair';

interface SecurityDetails {
  expectedHash: string;
  actualHash: string;
  quantity: number;
}

interface TransactionToastProps {
  show: boolean;
  status: TransactionStatus;
  message: string;
  txHash?: string;
  securityDetails?: SecurityDetails;
  onClose: () => void;
  onInvalidate?: () => void;
}

export default function TransactionToast({ show, status, message, txHash, securityDetails, onClose, onInvalidate }: TransactionToastProps) {
  useEffect(() => {
    // Auto-close only for success. Errors and Pending stay open.
    if (show && status === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, status, onClose]);

  const isSecurity = status === 'security_mismatch';
  const isBeyondRepair = status === 'beyond_repair';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
          exit={{ opacity: 0, y: 50, scale: 0.9, x: 50 }}
          className={`fixed bottom-8 right-8 z-50 shadow-2xl border overflow-hidden transition-all duration-500 ${
            isSecurity 
              ? 'w-[540px] bg-white border-red-500 border-2 rounded-[32px]' 
              : isBeyondRepair
              ? 'w-[420px] bg-[#0d1b1e] border-orange-500 border-2 rounded-[32px]'
              : 'min-w-[320px] max-w-md bg-white rounded-xl border-[#e2e9ec]'
          }`}
        >
          {isSecurity && (
            <div className="bg-red-500 px-6 py-3 text-white flex items-center gap-2">
               <ShieldAlert size={16} className="animate-pulse" />
               <p className="text-[10px] font-black uppercase tracking-widest">High Severity Alert: Fraud Detection</p>
            </div>
          )}

          {isBeyondRepair && (
            <div className="bg-orange-600 px-6 py-3 text-white flex items-center gap-2">
               <ShieldAlert size={16} />
               <p className="text-[10px] font-black uppercase tracking-widest">Permanent Registry Lock: Beyond Repair</p>
            </div>
          )}

          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`mt-1 p-2 rounded-xl ${
                status === 'pending' ? 'bg-blue-50 text-blue-500' :
                status === 'success' ? 'bg-green-50 text-green-500' :
                status === 'security_mismatch' ? 'bg-red-500 text-white shadow-lg' :
                status === 'beyond_repair' ? 'bg-orange-600 text-white shadow-lg' :
                'bg-red-50 text-red-500'
              }`}>
                {status === 'pending' && <Loader2 className="w-5 h-5 animate-spin" />}
                {status === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {status === 'error' && <XCircle className="w-5 h-5" />}
                {status === 'security_mismatch' && <ShieldAlert className="w-6 h-6" />}
                {status === 'beyond_repair' && <ShieldAlert className="w-6 h-6" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-bold text-sm ${isSecurity ? 'text-red-600' : isBeyondRepair ? 'text-orange-500' : 'text-[#012d1d]'}`}>
                    {status === 'pending' ? 'Transaction Processing' :
                     status === 'success' ? 'Transaction Confirmed' :
                     status === 'security_mismatch' ? 'Security Mismatch Detected' :
                     status === 'beyond_repair' ? 'Batch Permanently Locked' :
                     'Transaction Failed'}
                  </h4>
                  <button onClick={onClose} className="text-[#ccd4d8] hover:text-[#717973] transition">✕</button>
                </div>
                
                <p className={`text-xs leading-relaxed mb-4 ${isBeyondRepair ? 'text-gray-300' : 'text-[#717973]'}`}>
                  {message}
                </p>

                {isBeyondRepair && (
                  <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="p-4 bg-orange-950/30 border border-orange-900/50 rounded-2xl text-[10px] text-orange-200/80 leading-relaxed font-medium">
                      THIS PROJECT HAS FAILED ON-CHAIN INTEGRITY CHECKS. THE BLOCKCHAIN LEDGER HAS PERMANENTLY LOCKED THESE CREDITS. THEY CAN NO LONGER BE MINTED, TRADED, OR RETIRED.
                    </div>
                    <button 
                      onClick={onClose}
                      className="w-full py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
                    >
                      Understood
                    </button>
                  </div>
                )}

                {isSecurity && securityDetails && (
                  <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-[#fcfdfe] border border-[#e2e9ec] p-3 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CheckCircle2 size={12} className="text-[#136d3a]" />
                          <p className="text-[9px] font-bold text-[#717973] uppercase tracking-wider">Regulator's Digitized Seal</p>
                        </div>
                        <p className="text-[9px] font-mono text-[#136d3a] break-all bg-[#e8f5e9]/50 p-2 rounded-lg leading-tight">
                          {securityDetails.expectedHash || 'Unavailable in current session'}
                        </p>
                      </div>

                      <div className="bg-[#fff9f9] border border-red-100 p-3 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Cpu size={12} className="text-red-500" />
                          <p className="text-[9px] font-bold text-[#717973] uppercase tracking-wider">Calculated State Digest</p>
                        </div>
                        <p className="text-[9px] font-mono text-red-600 break-all bg-white p-2 rounded-lg leading-tight">
                          {securityDetails.actualHash || 'Calculation incomplete'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#e2e9ec]">
                       <p className="text-[9px] font-bold text-[#717973] uppercase tracking-widest">Impacted Quantity</p>
                       <p className="text-sm font-black text-[#012d1d]">{securityDetails.quantity.toLocaleString()} MT</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button 
                            onClick={onClose}
                            className="py-2.5 bg-gray-100 text-[#717973] rounded-xl text-xs font-bold hover:bg-gray-200 transition"
                        >
                            Dismiss
                        </button>
                        {onInvalidate && (
                            <button 
                                onClick={() => {
                                    onInvalidate();
                                }}
                                className="py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                            >
                                🔒 Lock Credit Batch
                            </button>
                        )}
                    </div>
                  </div>
                )}
                
                {txHash && !isSecurity && (
                  <div className="mt-3 pt-3 border-t border-[#f4fafd]">
                    <a 
                      href={`/audit?hash=${txHash}`}
                      className="text-[10px] font-bold text-[#13bf66] hover:underline flex items-center gap-1"
                    >
                      VIEW ON LEDGER ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {status === 'pending' && (
            <motion.div 
              className="h-1 bg-[#6bfe9c]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 30, ease: "linear" }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
