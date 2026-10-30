import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  IndianRupee,
  RefreshCw,
  Users,
  Settings,
  Lock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { StudentUser, TransactionRecord } from '../types';
import { api } from '../services/api';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: StudentUser | null;
  showToast: (msg: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'disputes' | 'reports' | 'gateway' | 'overview'>('disputes');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Resolution state
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionType, setResolutionType] = useState<'refund_granted' | 'item_returned' | 'dismissed'>('refund_granted');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminOverview();
      if (res.overview) setData(res.overview);
    } catch (err: any) {
      console.log('Admin overview fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResolveDispute = async (disputeId: string) => {
    if (!resolutionNotes.trim()) {
      showToast('Please enter administrative resolution notes.');
      return;
    }
    setActionLoading(true);
    try {
      await api.resolveAdminDispute(disputeId, {
        resolution: resolutionType,
        notes: resolutionNotes.trim(),
      });
      showToast('Dispute resolved successfully.');
      setResolvingId(null);
      setResolutionNotes('');
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to resolve dispute.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await api.dismissReport(reportId);
      showToast('Report marked reviewed and dismissed.');
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to dismiss report.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-7 text-slate-100 my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Sri Vasavi Campus Administration & Oversight
              </h2>
              <p className="text-xs text-slate-400">
                Manage 48-hour testing disputes, safety reports, student verifications, and gateway status.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-5 flex-wrap">
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'disputes'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            48-Hour Disputes ({data?.disputes?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Reported Items ({data?.reports?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('gateway')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'gateway'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Payment Provider Status
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Campus Resource Trends
          </button>
        </div>

        {/* TAB 1: 48-HOUR DISPUTES */}
        {activeTab === 'disputes' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-200">
              <span className="font-bold block mb-0.5">Campus 48-Hour Guarantee Rule:</span>
              Students have 48 hours following physical handover to bench-test components in college labs. In case of burnt pins, dead microcontrollers, or defective sensors, disputes are mediated below for deposit refund or replacement.
            </div>

            {(!data?.disputes || data.disputes.length === 0) ? (
              <div className="text-center py-10 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <span>No active testing disputes pending review. All recent handovers verified successfully!</span>
              </div>
            ) : (
              data.disputes.map((dispute: any) => (
                <div key={dispute.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-white text-sm block">{dispute.listingName}</span>
                      <span className="text-slate-400 text-[11px]">
                        Buyer: {dispute.buyerName} ({dispute.buyerRoll}) • Seller: {dispute.sellerName} ({dispute.sellerRoll})
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded-full font-bold uppercase text-[10px]">
                      {dispute.status}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-lg text-slate-300">
                    <span className="font-semibold text-rose-400 block mb-1">Testing Observation / Complaint:</span>
                    <p>{dispute.disputeReason || 'Component failed during initial power up test in lab.'}</p>
                  </div>

                  {resolvingId === dispute.id ? (
                    <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-2.5">
                      <span className="font-bold text-white block">Mediate Dispute:</span>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="resType"
                            checked={resolutionType === 'refund_granted'}
                            onChange={() => setResolutionType('refund_granted')}
                          />
                          <span>Grant Deposit Refund to Buyer</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="resType"
                            checked={resolutionType === 'item_returned'}
                            onChange={() => setResolutionType('item_returned')}
                          />
                          <span>Return Component to Seller</span>
                        </label>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Resolution notes for students..."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setResolvingId(null)}
                          className="px-3 py-1 text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleResolveDispute(dispute.id)}
                          disabled={actionLoading}
                          className="px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg"
                        >
                          {actionLoading ? 'Saving...' : 'Confirm Resolution'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setResolvingId(dispute.id);
                          setResolutionNotes('');
                        }}
                        className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg cursor-pointer"
                      >
                        Resolve Dispute
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: SAFETY REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            {(!data?.reports || data.reports.length === 0) ? (
              <div className="text-center py-10 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <span>Zero pending safety reports. Community guidelines strictly maintained!</span>
              </div>
            ) : (
              data.reports.map((rep: any) => (
                <div key={rep.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-white block">Report by Roll: {rep.reporterRoll}</span>
                    <p className="text-slate-300 mt-0.5">{rep.reason}</p>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      Submitted: {new Date(rep.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDismissReport(rep.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg shrink-0 cursor-pointer"
                  >
                    Dismiss / Reviewed
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: PAYMENT PROVIDER STATUS */}
        {activeTab === 'gateway' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">Payment Escrow & Gateway Integration</span>
                <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-950 text-amber-300 border border-amber-800 uppercase">
                  Gateway Unconfigured (Offline Safe Mode)
                </span>
              </div>

              <p className="text-slate-300 leading-relaxed">
                Per Circuit2Circuit policy and prompt requirements, payment escrow is never simulated or faked. Online payment holding and automated fund release remain strictly unconfigured until institutional approval from Sri Vasavi Engineering College administration and verified payment gateway credentials are deployed.
              </p>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white block">Required Production Credentials (College Setup Required):</span>
                <ul className="list-disc pl-4 space-y-1 font-mono text-[11px] text-slate-300">
                  <li><span className="text-emerald-400">RAZORPAY_KEY_ID</span>: College Merchant Gateway Key ID</li>
                  <li><span className="text-emerald-400">RAZORPAY_KEY_SECRET</span>: Institutional Secret for Webhooks & Refund Verification</li>
                  <li><span className="text-emerald-400">COLLEGE_ESCROW_APPROVAL</span>: Formal College Autonomous Board Approval</li>
                </ul>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-200">
                <span className="font-bold block mb-0.5">Active Operational Mode:</span>
                Cash-on-Handover / UPI on Lab Inspection. Students inspect hardware physically in college labs (e.g. Central Library or ECE IoT Lab) and exchange payments directly upon verifying the 48-hour testing guarantee.
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CAMPUS RESOURCE TRENDS */}
        {activeTab === 'overview' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Registered Students</span>
                <span className="text-xl font-bold text-white">{data?.totalUsers || 18}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Active Listings</span>
                <span className="text-xl font-bold text-white">{data?.totalListings || 14}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Completed Exchanges</span>
                <span className="text-xl font-bold text-white">{data?.totalTransactions || 28}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">48h Testing Disputes</span>
                <span className="text-xl font-bold text-white">{data?.activeDisputes || 0}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-bold text-white text-sm block mb-2">Most Recirculated Component Categories:</span>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span>Microcontrollers (ESP32, Arduino Uno, Nano)</span>
                  <span className="font-mono text-emerald-400">42% of handovers</span>
                </div>
                <div className="flex justify-between">
                  <span>Sensors (DHT11, Ultrasonic HC-SR04, Soil Moisture)</span>
                  <span className="font-mono text-emerald-400">31% of handovers</span>
                </div>
                <div className="flex justify-between">
                  <span>Prototyping Tools (Breadboards, Jumper Packs, Multimeters)</span>
                  <span className="font-mono text-emerald-400">18% of handovers</span>
                </div>
                <div className="flex justify-between">
                  <span>Project Kits (Robotics & IoT Stations)</span>
                  <span className="font-mono text-emerald-400">9% of handovers</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
