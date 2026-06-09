import React, { useState, useRef } from 'react';
import Modal from './ui/Modal';
import { Upload, FileSpreadsheet, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { LeadSchema } from '../lib/validators';

function parseCSV(text) {
  const lines = text.split(/\r\n|\n/);
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const row = [];
    let inQuotes = false;
    let currentToken = '';
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        // Strip outer quotes from token if present
        let token = currentToken.trim();
        if (token.startsWith('"') && token.endsWith('"')) {
          token = token.slice(1, -1);
        }
        row.push(token);
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
    let token = currentToken.trim();
    if (token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1);
    }
    row.push(token);
    result.push(row);
  }
  return result;
}

const CRM_FIELDS = [
  { key: 'name', label: 'Lead Name *', required: true },
  { key: 'company', label: 'Company Name', required: false },
  { key: 'phone', label: 'Phone Number', required: false },
  { key: 'email', label: 'Email Address', required: false },
  { key: 'source', label: 'Lead Source', required: false },
  { key: 'budget', label: 'Budget', required: false },
  { key: 'requirement', label: 'Requirement', required: false },
  { key: 'deal_value', label: 'Deal Value (₹)', required: false },
  { key: 'notes', label: 'Notes / Description', required: false }
];

export default function ImportLeads({ isOpen, onClose }) {
  const { addLead } = useCRM();
  const fileInputRef = useRef(null);
  const [csvData, setCsvData] = useState(null); // { headers: [], rows: [] }
  const [mapping, setMapping] = useState({}); // { crmFieldKey: csvHeaderIdx }
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Importing
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState(null); // { success: 0, failed: [], total: 0 }
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setErrorMsg('Please upload a valid CSV file.');
      return;
    }

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') return;
      
      const parsed = parseCSV(text);
      if (parsed.length < 2) {
        setErrorMsg('CSV file is empty or missing headers.');
        return;
      }

      const headers = parsed[0];
      const rows = parsed.slice(1);

      setCsvData({ headers, rows });
      
      // Auto-map simple matches
      const initialMapping = {};
      CRM_FIELDS.forEach(field => {
        const matchingHeaderIdx = headers.findIndex(h => 
          h.toLowerCase().includes(field.key.toLowerCase()) || 
          h.toLowerCase().replace(/[^a-z]/g, '').includes(field.key.replace(/[^a-z]/g, ''))
        );
        if (matchingHeaderIdx !== -1) {
          initialMapping[field.key] = String(matchingHeaderIdx);
        }
      });

      setMapping(initialMapping);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const executeImport = async () => {
    // Verify required mapping (name is required)
    if (mapping['name'] === undefined) {
      toast.error('You must map the Lead Name field.');
      return;
    }

    setStep(3);
    setProgress(0);

    const total = csvData.rows.length;
    let successCount = 0;
    const failures = [];

    for (let i = 0; i < total; i++) {
      const row = csvData.rows[i];
      const leadPayload = {
        name: '',
        company: '',
        phone: '',
        email: '',
        source: 'Manual',
        status: 'Warm',
        stage: 'new',
        budget: '',
        requirement: '',
        deal_value: 0,
        notes: ''
      };

      CRM_FIELDS.forEach(field => {
        const mappedHeaderIdx = mapping[field.key];
        if (mappedHeaderIdx !== undefined && mappedHeaderIdx !== '') {
          const val = row[parseInt(mappedHeaderIdx)];
          if (val !== undefined && val !== null) {
            if (field.key === 'deal_value') {
              const numeric = parseFloat(val.replace(/[^0-9.]/g, ''));
              leadPayload[field.key] = isNaN(numeric) ? 0 : numeric;
            } else {
              leadPayload[field.key] = String(val).trim();
            }
          }
        }
      });

      // Zod validation check
      try {
        const validated = LeadSchema.parse(leadPayload);
        await addLead(validated);
        successCount++;
      } catch (err) {
        failures.push({
          rowIdx: i + 2, // 1-based index including header
          name: leadPayload.name || 'Unknown',
          reason: err.errors?.[0]?.message || err.message || 'Validation error'
        });
      }

      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setImportResults({
      success: successCount,
      failed: failures,
      total
    });
    setStep(4);
  };

  const resetImport = () => {
    setCsvData(null);
    setMapping({});
    setStep(1);
    setProgress(0);
    setImportResults(null);
    setErrorMsg('');
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Import Leads from CSV" 
      maxWidth={step === 2 ? 'max-w-2xl' : 'max-w-md'}
    >
      {step === 1 && (
        <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col items-center gap-3 cursor-pointer group"
          >
            <Upload className="w-10 h-10 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-700">Click to upload CSV file</p>
              <p className="text-xs text-slate-400">or drag and drop your file here</p>
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </div>

          {errorMsg && (
            <div className="w-full p-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="text-left w-full mt-2 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">CSV Guidelines:</h4>
            <ul className="text-xs text-slate-500 list-disc pl-4 space-y-1">
              <li>First row must contain header columns (e.g. Name, Phone, Email, etc.).</li>
              <li>Only Lead Name is required. All other fields are optional.</li>
              <li>Email address must be in correct format (e.g., name@example.com).</li>
            </ul>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-700">Map CSV Columns</p>
              <p className="text-xs text-slate-500">{csvData.rows.length} rows loaded. Map your CSV headers to CRM lead fields.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
            {CRM_FIELDS.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">{field.label}</label>
                <select
                  value={mapping[field.key] || ''}
                  onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">-- Don't Map --</option>
                  {csvData.headers.map((hdr, idx) => (
                    <option key={idx} value={String(idx)}>{hdr}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={resetImport}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={executeImport}
              disabled={mapping['name'] === undefined || mapping['name'] === ''}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              Start Import
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
          <div className="space-y-1 w-full max-w-[200px]">
            <p className="text-sm font-semibold text-slate-700">Importing Leads...</p>
            <p className="text-xs text-slate-400">{progress}% complete</p>
          </div>
          
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-indigo-600 h-2 transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Import Complete!</h3>
            <p className="text-sm text-slate-500">
              Successfully imported <span className="font-semibold text-slate-800">{importResults.success}</span> of {importResults.total} leads.
            </p>
          </div>

          {importResults.failed.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Failed Rows ({importResults.failed.length}):</p>
              <div className="max-h-[150px] overflow-y-auto border border-red-100 bg-red-50/30 rounded-xl p-3 divide-y divide-red-100/50 text-[11px] font-medium text-slate-600">
                {importResults.failed.map((fail, idx) => (
                  <div key={idx} className="py-1.5 first:pt-0 last:pb-0 flex items-start gap-2 justify-between">
                    <span>Row {fail.rowIdx} ({fail.name})</span>
                    <span className="text-red-700 text-right">{fail.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center pt-2">
            <button
              onClick={() => {
                onClose();
                resetImport();
              }}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors text-center cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
