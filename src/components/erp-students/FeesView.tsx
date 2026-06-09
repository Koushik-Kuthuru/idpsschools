"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Wallet, 
  Download, 
  ArrowUpRight, 
  Receipt,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink
} from "lucide-react";

export default function FeesView() {
  const { user } = useAuth();
  const student: any = user || {};
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  // Calculations
  const lastYearDue = parseInt(student.feeDetails?.lastYearDue || "0", 10);
  const transportFees = student.transportDetails?.fees || [];
  const transportTotal = transportFees.reduce((sum: number, val: string) => sum + (parseInt(val, 10) || 0), 0);
  const feeGrid = student.feeDetails?.feeGrid || [];
  const gridTotal = feeGrid.reduce((sum: number, row: any) => {
    const rowSum = row.values?.reduce((acc: number, val: string) => acc + (parseInt(val, 10) || 0), 0) || 0;
    return sum + rowSum;
  }, 0);
  const grandTotalFees = gridTotal + lastYearDue + transportTotal;

  const paidAmount = Math.round(grandTotalFees * 0.7); // Mocking 70% paid
  const pendingAmount = grandTotalFees - paidAmount;

  const transactions = [
    { id: "TXN98327", date: "May 10, 2026", head: "Admission Fee + Tuition (Q1)", amount: paidAmount, method: "UPI", status: "Success" },
    { id: "TXN76214", date: "Jul 15, 2026", head: "Hostel Fee (Term 1)", amount: 35000, method: "Net Banking", status: "Success" },
    { id: "TXN29871", date: "Sep 01, 2026", head: "Transport Fee (Q2)", amount: 12000, method: "Credit Card", status: "Failed" },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 animate-in fade-in duration-500 font-jost space-y-4">
      {/* Header */}
      <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight uppercase">Finance & Fees</h2>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Fee balances, billing ledgers, and payment history</p>
        </div>
        <button 
          onClick={() => setIsPayModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#144835] text-white hover:bg-[#144835]/90 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-md shadow-[#144835]/20"
        >
          <CreditCard size={14} />
          Pay Online Now
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Fee Structure */}
        <div className="bg-white border border-gray-100 p-6 rounded-[16px] flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#a2c144]/10 rounded-full blur-3xl pointer-events-none" />
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Structured Fee</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold text-[#144835]">₹{grandTotalFees.toLocaleString()}</span>
            </div>
          </div>
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-4">
            Category: {student.feeDetails?.feeCategory || "GENERAL"}
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white border border-gray-100 p-6 rounded-[16px] flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Paid Amount</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold text-emerald-700">₹{paidAmount.toLocaleString()}</span>
            </div>
          </div>
          <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider mt-4 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500" /> Payment logs are verified
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-red-50/20 border border-dashed border-red-200 p-6 rounded-[16px] flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div>
            <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Net Due Balance</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold text-red-700">₹{pendingAmount.toLocaleString()}</span>
            </div>
          </div>
          <div className="text-xs text-red-600 font-bold uppercase tracking-wider mt-4 flex items-center gap-1.5">
            <Clock size={13} className="text-red-500 animate-pulse" /> Next due: June 30, 2026
          </div>
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="bg-white border border-gray-100 rounded-[16px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <div className="px-6 py-4 border-b border-gray-100 bg-[#F8FAFB]">
          <h3 className="text-xs font-bold text-[#144835] uppercase tracking-wider">Transaction Ledger</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-3">Transaction ID</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Fee Category</th>
                <th className="px-6 py-3 text-center">Amount</th>
                <th className="px-6 py-3 text-center">Payment Method</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
              {transactions.map((txn, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-[#144835] font-bold">{txn.id}</td>
                  <td className="px-6 py-4 text-gray-400">{txn.date}</td>
                  <td className="px-6 py-4 text-gray-900">{txn.head}</td>
                  <td className="px-6 py-4 text-center">₹{txn.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center text-gray-400">{txn.method}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      txn.status === "Success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                      "bg-red-50 text-red-700 border border-red-100"
                    }`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {txn.status === "Success" ? (
                      <button 
                        onClick={() => alert(`Downloading PDF receipt for ${txn.id}`)}
                        className="text-[#144835] hover:underline font-bold uppercase tracking-wider text-xs flex items-center justify-end gap-1 ml-auto"
                      >
                        <Download size={11} /> Receipt
                      </button>
                    ) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Online Pay Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-gray-100 rounded-[16px] w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-sm font-bold text-[#144835] uppercase tracking-wider">Simulated Payment Portal</h3>
                <p className="text-xs text-gray-400 font-bold uppercase mt-1">Outstanding Balance: ₹{pendingAmount.toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setIsPayModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Payment Amount (INR)</label>
                <input 
                  type="text" 
                  disabled 
                  value={`₹${pendingAmount.toLocaleString()}`}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-bold text-[#144835]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                  {["UPI", "Net Banking", "Card"].map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${
                        paymentMethod === m 
                          ? "bg-[#144835] text-white border-[#144835]" 
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50/50 p-4 border border-emerald-100 rounded-lg mt-4">
                <p className="text-xs text-emerald-800 font-bold leading-normal uppercase">
                  🔒 Encrypted Payment System
                </p>
                <p className="text-xs text-emerald-600 font-semibold mt-0.5 leading-normal">
                  All transactions are secured via bank-level SSL encryption.
                </p>
              </div>

              <button
                onClick={() => {
                  alert("Simulated Payment of ₹" + pendingAmount.toLocaleString() + " Completed Successfully!");
                  setIsPayModalOpen(false);
                }}
                className="w-full py-3.5 bg-[#144835] hover:bg-[#144835]/90 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors shadow-md mt-4"
              >
                Authorize & Pay Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
