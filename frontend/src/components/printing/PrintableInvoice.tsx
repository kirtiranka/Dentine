import React, { forwardRef } from 'react';
import type { Patient } from '../../types/patient';
import type { Invoice } from '../../types/billing';

interface PrintableInvoiceProps {
  patient: Patient;
  invoice: Invoice;
  clinicInfo?: {
    name: string;
    address: string;
    phone: string;
    regNumber?: string;
  };
}

export const PrintableInvoice = forwardRef<HTMLDivElement, PrintableInvoiceProps>(
  ({ patient, invoice, clinicInfo }, ref) => {
    const items = invoice.details?.items || [];
    const dateStr = new Date(invoice.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return (
      <div ref={ref} className="print-sheet p-8 bg-white text-slate-900 font-sans max-w-3xl mx-auto">
        {/* Clinic Letterhead */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide">
              {clinicInfo?.name || 'Dental Poly-Clinic & Implant Centre'}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {clinicInfo?.address || '102 Medical Arcade, Heritage Drive, Pune, MH'}
            </p>
            <p className="text-xs text-slate-600">
              Tel: {clinicInfo?.phone || '+91 98765 43210'} | Reg No: {clinicInfo?.regNumber || 'MH/DENT/2022/4102'}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-0.5 border border-slate-800 text-xs font-bold uppercase tracking-wider mb-1">
              TAX INVOICE
            </span>
            <div className="text-xs font-mono font-bold">INV-#{invoice.id.slice(0, 8).toUpperCase()}</div>
            <div className="text-xs text-slate-500 font-mono">Date: {dateStr}</div>
          </div>
        </div>

        {/* Patient Details Ribbon */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 text-xs mb-6">
          <div>
            <span className="text-slate-400 block uppercase text-[10px] font-bold">Patient Name</span>
            <strong className="text-slate-900 text-sm">{patient.name}</strong>
            <div className="text-slate-600 mt-0.5">Patient ID: {patient.id.slice(0, 8)}</div>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block uppercase text-[10px] font-bold">Contact</span>
            <div className="text-slate-800">{patient.details?.contact?.phone || 'No phone recorded'}</div>
            <div className="text-slate-600">{patient.details?.contact?.email || ''}</div>
          </div>
        </div>

        {/* Itemized Procedures Table */}
        <table className="w-full text-xs border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-slate-300 text-slate-600 uppercase text-[10px] tracking-wider text-left">
              <th className="py-2.5 px-2">#</th>
              <th className="py-2.5 px-2">Clinical Procedure / Item</th>
              <th className="py-2.5 px-2 text-right">Fee (₹)</th>
              <th className="py-2.5 px-2 text-right">Discount (₹)</th>
              <th className="py-2.5 px-2 text-right">Net (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, idx) => {
              const net = Math.max(0, item.amount - (item.discount || 0));
              return (
                <tr key={idx} className="break-inside-avoid">
                  <td className="py-2.5 px-2 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-2 font-medium text-slate-800">{item.description}</td>
                  <td className="py-2.5 px-2 text-right font-mono">{Number(item.amount).toFixed(2)}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-500">
                    {item.discount ? Number(item.discount).toFixed(2) : '0.00'}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                    {net.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Total Calculation */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-1.5 text-xs">
            <div className="flex justify-between py-1.5 border-t-2 border-slate-900 font-bold text-sm">
              <span>Total Amount:</span>
              <span className="font-mono">
                ₹{Number(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>Payment Status:</span>
              <span className="font-bold uppercase tracking-wider">{invoice.status}</span>
            </div>
          </div>
        </div>

        {invoice.details?.notes && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 mb-8">
            <strong>Advisory / Instructions:</strong> {invoice.details.notes}
          </div>
        )}

        {/* Footer & Signature */}
        <div className="pt-12 mt-auto border-t border-slate-200 flex justify-between items-end text-xs">
          <div className="text-[10px] text-slate-400">
            Generated via Dental EMR • Computer-generated valid tax invoice
          </div>
          <div className="text-center w-48 border-t border-slate-400 pt-1 font-medium text-slate-700">
            Authorized Clinician / Signatory
          </div>
        </div>
      </div>
    );
  }
);

PrintableInvoice.displayName = 'PrintableInvoice';