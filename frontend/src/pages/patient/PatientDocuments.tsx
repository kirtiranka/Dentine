import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Patient } from '../../types/patient';
import type { PatientDocument, DocumentType } from '../../types/document';
import {
  useDocuments,
  useUploadDocument,
  useUpdateDocument,
  getDocumentPublicUrl,
} from '../../hooks/useDocuments';

const typeBadges: Record<DocumentType, { label: string; class: string }> = {
  xray: { label: 'X-Ray', class: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  lab_report: { label: 'Lab Report', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  prescription_scan: { label: 'Prescription', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  consent_form: { label: 'Consent Form', class: 'bg-purple-50 text-purple-700 border-purple-200' },
  other: { label: 'Other', class: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const PatientDocuments: React.FC = () => {
  const { patient } = useOutletContext<{ patient: Patient }>();
  const [isUploading, setIsUploading] = useState(false);
  const [activePreviewDoc, setActivePreviewDoc] = useState<PatientDocument | null>(null);

  const { data: documents, isLoading, isError, error } = useDocuments(patient.id);

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Clinical Documents & Imaging</h2>
          <p className="text-xs text-slate-500">
            Upload and view periapical X-rays, lab reports, consent scans, and diagnostic records.
          </p>
        </div>
        {!isUploading && (
          <button
            type="button"
            onClick={() => setIsUploading(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
          >
            + Upload Document
          </button>
        )}
      </div>

      {/* Upload Zone Modal / Card */}
      {isUploading && (
        <UploadDocumentCard patient={patient} onClose={() => setIsUploading(false)} />
      )}

      {/* Documents Grid */}
      <div>
        {isLoading && (
          <div className="bg-white p-12 text-center text-sm text-slate-400 rounded-lg border border-slate-200">
            Loading patient media...
          </div>
        )}

        {isError && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 text-xs rounded-md">
            Failed to load documents: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && documents?.length === 0 && !isUploading && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-sm font-medium text-slate-700">No documents found</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Attach X-rays, treatment photographs, or scanned PDFs for this patient.
            </p>
            <button
              type="button"
              onClick={() => setIsUploading(true)}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              Upload First File
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents?.map((doc) => (
            <DocumentThumbnailCard
              key={doc.id}
              doc={doc}
              patientId={patient.id}
              onOpenPreview={() => setActivePreviewDoc(doc)}
            />
          ))}
        </div>
      </div>

      {/* Lightbox / Preview Modal */}
      {activePreviewDoc && (
        <DocumentLightboxModal
          doc={activePreviewDoc}
          onClose={() => setActivePreviewDoc(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: Upload Form Card
// ============================================================================
const UploadDocumentCard: React.FC<{
  patient: Patient;
  onClose: () => void;
}> = ({ patient, onClose }) => {
  const uploadMutation = useUploadDocument(patient.id);

  const [name, setName] = useState('');
  const [type, setType] = useState<DocumentType>('xray');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto-fill title with original filename without extension if empty
      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedFile) {
      setErrorMsg('Please select a file to upload.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Please give this document a descriptive title.');
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        clinicId: patient.clinic_id,
        name: name.trim(),
        type,
        file: selectedFile,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-blue-500 shadow-md p-6">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Upload Clinical File
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-xs font-medium"
        >
          Cancel
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-2.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        {/* File Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Select File (PNG, JPG, WEBP, PDF)
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Document Display Name
            </label>
            <input
              type="text"
              placeholder="e.g. Tooth #46 Pre-op IOPA X-Ray"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Category
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="xray">X-Ray (IOPA / OPG)</option>
              <option value="lab_report">Lab Diagnostic Report</option>
              <option value="prescription_scan">Prescription Scan</option>
              <option value="consent_form">Consent Form</option>
              <option value="other">Other Attachment</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploadMutation.isPending}
            className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50"
          >
            {uploadMutation.isPending ? 'Uploading to Storage...' : 'Save to Patient File'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================================
// COMPONENT: Thumbnail Card with View / Edit Controller
// ============================================================================
const DocumentThumbnailCard: React.FC<{
  doc: PatientDocument;
  patientId: string;
  onOpenPreview: () => void;
}> = ({ doc, patientId, onOpenPreview }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-slate-300 transition-all">
      {!isEditing ? (
        <ThumbnailView doc={doc} onOpenPreview={onOpenPreview} onEdit={() => setIsEditing(true)} />
      ) : (
        <ThumbnailEditForm doc={doc} patientId={patientId} onCancel={() => setIsEditing(false)} />
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: Thumbnail View Mode
// ============================================================================
const ThumbnailView: React.FC<{
  doc: PatientDocument;
  onOpenPreview: () => void;
  onEdit: () => void;
}> = ({ doc, onOpenPreview, onEdit }) => {
  const publicUrl = getDocumentPublicUrl(doc.storage_path);
  const isPdf = doc.storage_path.toLowerCase().endsWith('.pdf');
  const badge = typeBadges[doc.type] || typeBadges.other;

  return (
    <>
      {/* Thumbnail Area */}
      <div
        onClick={onOpenPreview}
        className="h-44 bg-slate-900 cursor-pointer overflow-hidden relative flex items-center justify-center group-hover:opacity-95 transition-opacity"
      >
        {isPdf ? (
          <div className="flex flex-col items-center justify-center text-slate-300">
            <span className="text-4xl mb-1">📄</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">PDF Document</span>
          </div>
        ) : (
          <img
            src={publicUrl}
            alt={doc.name}
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
          <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded shadow transition-opacity">
            Click to View
          </span>
        </div>
      </div>

      {/* Info & Metadata */}
      <div className="p-3.5 flex flex-col flex-1 justify-between bg-white">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${badge.class}`}>
              {badge.label}
            </span>
            <button
              type="button"
              onClick={onEdit}
              className="text-xs text-slate-400 hover:text-slate-700 px-1 py-0.5"
            >
              Edit
            </button>
          </div>
          <h4
            onClick={onOpenPreview}
            title={doc.name}
            className="text-xs font-bold text-slate-800 truncate cursor-pointer hover:text-blue-600"
          >
            {doc.name}
          </h4>
        </div>

        <div className="text-[11px] text-slate-400 mt-2 border-t border-slate-50 pt-2 flex justify-between items-center">
          <span>{new Date(doc.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Download
          </a>
        </div>
      </div>
    </>
  );
};

// ============================================================================
// COMPONENT: Thumbnail Edit Form (Zero useEffect)
// ============================================================================
const ThumbnailEditForm: React.FC<{
  doc: PatientDocument;
  patientId: string;
  onCancel: () => void;
}> = ({ doc, patientId, onCancel }) => {
  const updateMutation = useUpdateDocument(patientId);

  // Direct initialization from props on mount
  const [name, setName] = useState(doc.name);
  const [type, setType] = useState<DocumentType>(doc.type);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Name is required.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: doc.id,
        name: name.trim(),
        type,
      });
      onCancel();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <form onSubmit={handleUpdate} className="p-4 bg-slate-50 space-y-3 flex-1 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-700 uppercase">Edit Document Details</span>
        </div>

        {errorMsg && <div className="text-xs text-red-600">{errorMsg}</div>}

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DocumentType)}
            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="xray">X-Ray</option>
            <option value="lab_report">Lab Report</option>
            <option value="prescription_scan">Prescription Scan</option>
            <option value="consent_form">Consent Form</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1 text-xs text-slate-600 bg-white hover:bg-slate-100 rounded border border-slate-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="px-3 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};

// ============================================================================
// COMPONENT: Lightbox Modal Viewer
// ============================================================================
const DocumentLightboxModal: React.FC<{
  doc: PatientDocument;
  onClose: () => void;
}> = ({ doc, onClose }) => {
  const publicUrl = getDocumentPublicUrl(doc.storage_path);
  const isPdf = doc.storage_path.toLowerCase().endsWith('.pdf');

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950 text-white">
          <div>
            <h3 className="text-sm font-semibold truncate max-w-md">{doc.name}</h3>
            <span className="text-[11px] text-slate-400 capitalize">{doc.type.replace(/_/g, ' ')}</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
            >
              Open Original ↗
            </a>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white text-lg font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content / Previewer */}
        <div className="flex-1 bg-black/60 flex items-center justify-center p-4 overflow-auto min-h-[450px]">
          {isPdf ? (
            <iframe
              src={publicUrl}
              title={doc.name}
              className="w-full h-[650px] rounded border border-slate-800 bg-white"
            />
          ) : (
            <img
              src={publicUrl}
              alt={doc.name}
              className="max-h-[70vh] max-w-full object-contain rounded"
            />
          )}
        </div>
      </div>
    </div>
  );
};