'use client';

import { useState, useCallback } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import {
  Download,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  RefreshCw,
} from 'lucide-react';
import {
  CSVParser,
  ParseResult,
  ValidationError,
  ValidationWarning,
} from '@/lib/bulk-import/csvParser';
import { downloadCSVTemplate, ProductCSVRow } from '@/lib/bulk-import/csvTemplate';

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors?: string[];
  rollbackId?: string;
}

export default function BulkImport({ onImportComplete }: { onImportComplete?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setParseResult(null);
      setImportResult(null);
      setSelectedRows(new Set());
    }
  }, []);

  const handleParse = useCallback(async () => {
    if (!file) return;

    setParsing(true);
    try {
      const result = await CSVParser.parseCSV(file);
      setParseResult(result);

      // Auto-select all valid rows
      if (result.success && result.data) {
        setSelectedRows(new Set(result.data.map((_, index) => index)));
      }
    } catch (error) {
      console.error('Parse error:', error);
      setParseResult({
        success: false,
        errors: [
          {
            row: 0,
            field: 'file',
            message: 'Failed to parse CSV file',
          },
        ],
      });
    } finally {
      setParsing(false);
    }
  }, [file]);

  const handleImport = useCallback(async () => {
    if (!parseResult?.data) return;

    const rowsToImport = parseResult.data.filter((_, index) => selectedRows.has(index));
    if (rowsToImport.length === 0) {
      alert('Please select at least one row to import');
      return;
    }

    setImporting(true);
    try {
      const response = await fetch('/api/admin/products/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: rowsToImport }),
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success && onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        imported: 0,
        failed: rowsToImport.length,
        errors: ['Failed to import products. Please try again.'],
      });
    } finally {
      setImporting(false);
    }
  }, [parseResult, selectedRows, onImportComplete]);

  const handleRollback = useCallback(async () => {
    if (!importResult?.rollbackId) return;

    if (
      !confirm(
        'Are you sure you want to rollback this import? This will delete all products created in this import.'
      )
    ) {
      return;
    }

    setImporting(true);
    try {
      const response = await fetch('/api/admin/products/bulk-import/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollbackId: importResult.rollbackId }),
      });

      if (response.ok) {
        alert('Import rolled back successfully');
        setFile(null);
        setParseResult(null);
        setImportResult(null);
        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        alert('Failed to rollback import');
      }
    } catch (error) {
      console.error('Rollback error:', error);
      alert('Failed to rollback import');
    } finally {
      setImporting(false);
    }
  }, [importResult, onImportComplete]);

  const toggleRowSelection = (index: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedRows(newSelection);
  };

  const selectAll = () => {
    if (parseResult?.data) {
      setSelectedRows(new Set(parseResult.data.map((_, index) => index)));
    }
  };

  const deselectAll = () => {
    setSelectedRows(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Template Download */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold mb-4">Step 1: Download Template</h3>
          <p className="text-gray-600 mb-4">
            Download the CSV template to see the required format for bulk importing products.
          </p>
          <Button onClick={downloadCSVTemplate} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download CSV Template
          </Button>
        </CardBody>
      </Card>

      {/* File Upload */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold mb-4">Step 2: Upload CSV File</h3>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
                disabled={importing}
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">
                  {file ? file.name : 'Click to select CSV file or drag and drop'}
                </p>
                {file && (
                  <p className="text-sm text-gray-500 mt-2">
                    Size: {(file.size / 1024).toFixed(2)} KB
                  </p>
                )}
              </label>
            </div>

            {file && !parseResult && (
              <Button onClick={handleParse} disabled={parsing}>
                {parsing ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Parse CSV
                  </>
                )}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Validation Results */}
      {parseResult && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">Step 3: Review & Import</h3>

            {/* Errors */}
            {parseResult.errors && parseResult.errors.length > 0 && (
              <Alert type="error" className="mb-4">
                <div className="space-y-2">
                  <p className="font-semibold">Validation Errors:</p>
                  {parseResult.errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="text-sm">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Row {error.row}, {error.field}: {error.message}
                    </div>
                  ))}
                  {parseResult.errors.length > 5 && (
                    <p className="text-sm">...and {parseResult.errors.length - 5} more errors</p>
                  )}
                </div>
              </Alert>
            )}

            {/* Warnings */}
            {parseResult.warnings && parseResult.warnings.length > 0 && (
              <Alert type="warning" className="mb-4">
                <div className="space-y-2">
                  <p className="font-semibold">Warnings:</p>
                  {parseResult.warnings.slice(0, 3).map((warning, index) => (
                    <div key={index} className="text-sm">
                      Row {warning.row}, {warning.field}: {warning.message}
                    </div>
                  ))}
                  {parseResult.warnings.length > 3 && (
                    <p className="text-sm">
                      ...and {parseResult.warnings.length - 3} more warnings
                    </p>
                  )}
                </div>
              </Alert>
            )}

            {/* Success & Preview */}
            {parseResult.success && parseResult.data && (
              <>
                <Alert type="success" className="mb-4">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Successfully parsed {parseResult.data.length} products
                </Alert>

                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {showPreview ? 'Hide' : 'Show'} Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                      Deselect All
                    </Button>
                  </div>
                  <span className="text-sm text-gray-600">
                    {selectedRows.size} of {parseResult.data.length} selected
                  </span>
                </div>

                {/* Preview Table */}
                {showPreview && (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="p-2 text-left">
                            <input
                              type="checkbox"
                              checked={selectedRows.size === parseResult.data.length}
                              onChange={(e) => (e.target.checked ? selectAll() : deselectAll())}
                            />
                          </th>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Category</th>
                          <th className="p-2 text-left">SKU</th>
                          <th className="p-2 text-left">Price</th>
                          <th className="p-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseResult.data.slice(0, 10).map((row, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                              <input
                                type="checkbox"
                                checked={selectedRows.has(index)}
                                onChange={() => toggleRowSelection(index)}
                              />
                            </td>
                            <td className="p-2">{row.name}</td>
                            <td className="p-2">{row.category}</td>
                            <td className="p-2">{row.sku || 'Auto-generate'}</td>
                            <td className="p-2">{row.price ? `$${row.price}` : '-'}</td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  row.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : row.status === 'inactive'
                                      ? 'bg-gray-100 text-gray-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {row.status || 'active'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parseResult.data.length > 10 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Showing 10 of {parseResult.data.length} products
                      </p>
                    )}
                  </div>
                )}

                {/* Import Button */}
                <div className="flex gap-2">
                  <Button onClick={handleImport} disabled={importing || selectedRows.size === 0}>
                    {importing ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import {selectedRows.size} Products
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null);
                      setParseResult(null);
                      setImportResult(null);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">Import Results</h3>

            {importResult.success ? (
              <Alert type="success" className="mb-4">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Successfully imported {importResult.imported} products
              </Alert>
            ) : (
              <Alert type="error" className="mb-4">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Import failed. {importResult.failed} products could not be imported.
              </Alert>
            )}

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="mb-4">
                <p className="font-semibold mb-2">Errors:</p>
                <ul className="list-disc list-inside space-y-1">
                  {importResult.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              {importResult.rollbackId && (
                <Button variant="outline" onClick={handleRollback} disabled={importing}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Rollback Import
                </Button>
              )}
              <Button
                onClick={() => {
                  setFile(null);
                  setParseResult(null);
                  setImportResult(null);
                }}
              >
                Start New Import
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
