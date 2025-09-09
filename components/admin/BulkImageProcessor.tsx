'use client';

import { useState, useCallback } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import {
  Upload,
  FileArchive,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  RefreshCw,
  Image,
  Package,
} from 'lucide-react';
import { ZipProcessor, ExtractedFile, ProcessingResult } from '@/lib/bulk-import/zipProcessor';
import { BatchProcessor, BatchJob, BatchProgress } from '@/lib/bulk-import/batchProcessor';

interface MatchedFiles {
  productSku: string;
  productName: string;
  files: ExtractedFile[];
}

interface ProcessingStats {
  totalFiles: number;
  matchedFiles: number;
  unmatchedFiles: number;
  totalProducts: number;
  productsWithFiles: number;
}

export default function BulkImageProcessor({
  onProcessingComplete,
}: {
  onProcessingComplete?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState<ProcessingResult | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [matchedFiles, setMatchedFiles] = useState<MatchedFiles[]>([]);
  const [unmatchedFiles, setUnmatchedFiles] = useState<ExtractedFile[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [batchProcessor] = useState(() => new BatchProcessor(3));
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.zip')) {
        alert('Please select a ZIP file');
        return;
      }
      setFile(selectedFile);
      setExtractResult(null);
      setMatchedFiles([]);
      setUnmatchedFiles([]);
      setBatchProgress(null);
      setProcessingStats(null);
      setSelectedProducts(new Set());
    }
  }, []);

  const handleExtract = useCallback(async () => {
    if (!file) return;

    setExtracting(true);
    try {
      // First, fetch available products
      const response = await fetch('/api/admin/products');
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      const { products: fetchedProducts } = await response.json();
      setProducts(fetchedProducts || []);

      // Extract files from ZIP
      const result = await ZipProcessor.extractImages(file);
      setExtractResult(result);

      if (result.success && result.extracted.length > 0) {
        // Match files to products
        const matches = ZipProcessor.matchFilesToProducts(result.extracted, fetchedProducts || []);

        const matchedList: MatchedFiles[] = [];
        const unmatched: ExtractedFile[] = [];

        matches.forEach((files, sku) => {
          if (sku === '__unmatched__') {
            unmatched.push(...files);
          } else if (files.length > 0) {
            const product = fetchedProducts?.find((p: any) => p.sku === sku);
            if (product) {
              matchedList.push({
                productSku: sku,
                productName: product.name,
                files,
              });
            }
          }
        });

        setMatchedFiles(matchedList);
        setUnmatchedFiles(unmatched);

        // Auto-select all products with matched files
        setSelectedProducts(new Set(matchedList.map((m) => m.productSku)));

        // Calculate stats
        const stats: ProcessingStats = {
          totalFiles: result.extracted.length,
          matchedFiles: result.extracted.length - unmatched.length,
          unmatchedFiles: unmatched.length,
          totalProducts: fetchedProducts?.length || 0,
          productsWithFiles: matchedList.length,
        };
        setProcessingStats(stats);
      }
    } catch (error) {
      console.error('Extract error:', error);
      setExtractResult({
        success: false,
        extracted: [],
        errors: ['Failed to extract ZIP file'],
        skipped: [],
      });
    } finally {
      setExtracting(false);
    }
  }, [file]);

  const handleProcess = useCallback(async () => {
    if (!matchedFiles.length || selectedProducts.size === 0) {
      alert('No products selected for processing');
      return;
    }

    setProcessing(true);

    try {
      // Create batch jobs for selected products
      const jobs: BatchJob[] = [];

      matchedFiles.forEach((matched) => {
        if (selectedProducts.has(matched.productSku)) {
          jobs.push({
            id: `job_${matched.productSku}_${Date.now()}`,
            productSku: matched.productSku,
            files: matched.files.map((f) => ({
              name: f.name,
              data: f.data,
              type: f.type,
            })),
            status: 'pending',
            progress: 0,
          });
        }
      });

      // Set up progress tracking
      batchProcessor.setProgressCallback((progress) => {
        setBatchProgress(progress);
      });

      // Add jobs and start processing
      batchProcessor.addJobs(jobs);
      await batchProcessor.start();

      if (onProcessingComplete) {
        onProcessingComplete();
      }
    } catch (error) {
      console.error('Processing error:', error);
      alert('Failed to process images. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [matchedFiles, selectedProducts, batchProcessor, onProcessingComplete]);

  const toggleProductSelection = (sku: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(sku)) {
      newSelection.delete(sku);
    } else {
      newSelection.add(sku);
    }
    setSelectedProducts(newSelection);
  };

  const selectAll = () => {
    setSelectedProducts(new Set(matchedFiles.map((m) => m.productSku)));
  };

  const deselectAll = () => {
    setSelectedProducts(new Set());
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold mb-4">Step 1: Upload ZIP File</h3>
          <p className="text-gray-600 mb-4">
            Upload a ZIP file containing product images. Images will be automatically matched to
            products by filename.
          </p>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                className="hidden"
                id="zip-upload"
                disabled={processing || extracting}
              />
              <label htmlFor="zip-upload" className="cursor-pointer">
                <FileArchive className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">
                  {file ? file.name : 'Click to select ZIP file or drag and drop'}
                </p>
                {file && (
                  <p className="text-sm text-gray-500 mt-2">
                    Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </label>
            </div>

            {file && !extractResult && (
              <Button onClick={handleExtract} disabled={extracting}>
                {extracting ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <FileArchive className="w-4 h-4 mr-2" />
                    Extract Images
                  </>
                )}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Extraction Results */}
      {extractResult && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">Step 2: Review Extracted Images</h3>

            {/* Errors */}
            {extractResult.errors && extractResult.errors.length > 0 && (
              <Alert type="error" className="mb-4">
                <div className="space-y-2">
                  <p className="font-semibold">Extraction Errors:</p>
                  {extractResult.errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="text-sm">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      {error}
                    </div>
                  ))}
                  {extractResult.errors.length > 5 && (
                    <p className="text-sm">...and {extractResult.errors.length - 5} more errors</p>
                  )}
                </div>
              </Alert>
            )}

            {/* Success & Stats */}
            {extractResult.success && processingStats && (
              <>
                <Alert type="success" className="mb-4">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Successfully extracted {extractResult.extracted.length} images
                </Alert>

                {/* Processing Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {processingStats.totalFiles}
                    </div>
                    <div className="text-sm text-blue-800">Total Images</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {processingStats.matchedFiles}
                    </div>
                    <div className="text-sm text-green-800">Matched</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {processingStats.unmatchedFiles}
                    </div>
                    <div className="text-sm text-yellow-800">Unmatched</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {processingStats.productsWithFiles}
                    </div>
                    <div className="text-sm text-purple-800">Products</div>
                  </div>
                </div>

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
                    {selectedProducts.size} of {matchedFiles.length} products selected
                  </span>
                </div>

                {/* Preview */}
                {showPreview && (
                  <div className="space-y-4 mb-4">
                    <h4 className="font-medium">Matched Products:</h4>
                    {matchedFiles.map((matched) => (
                      <div key={matched.productSku} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(matched.productSku)}
                            onChange={() => toggleProductSelection(matched.productSku)}
                          />
                          <Package className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{matched.productName}</div>
                            <div className="text-sm text-gray-500">SKU: {matched.productSku}</div>
                          </div>
                        </div>
                        <div className="ml-7 grid grid-cols-4 gap-2">
                          {matched.files.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <Image className="w-3 h-3" />
                              <span className="truncate">{file.name}</span>
                              <span className="text-gray-500">
                                ({(file.size / 1024).toFixed(0)}KB)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {unmatchedFiles.length > 0 && (
                      <div className="border rounded-lg p-4 bg-yellow-50">
                        <h5 className="font-medium text-yellow-800 mb-2">Unmatched Files:</h5>
                        <div className="grid grid-cols-3 gap-2">
                          {unmatchedFiles.map((file, index) => (
                            <div key={index} className="text-sm text-yellow-700">
                              {file.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Process Button */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleProcess}
                    disabled={processing || selectedProducts.size === 0}
                  >
                    {processing ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Process {selectedProducts.size} Products
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null);
                      setExtractResult(null);
                      setMatchedFiles([]);
                      setUnmatchedFiles([]);
                      setBatchProgress(null);
                      setProcessingStats(null);
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

      {/* Processing Progress */}
      {batchProgress && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">Processing Progress</h3>

            <div className="space-y-4">
              {/* Overall Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Progress</span>
                  <span>{batchProgress.overallProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${batchProgress.overallProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-5 gap-3 text-center text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="font-bold">{batchProgress.total}</div>
                  <div className="text-gray-600">Total</div>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <div className="font-bold text-blue-600">{batchProgress.processing}</div>
                  <div className="text-blue-800">Processing</div>
                </div>
                <div className="bg-yellow-50 p-2 rounded">
                  <div className="font-bold text-yellow-600">{batchProgress.pending}</div>
                  <div className="text-yellow-800">Pending</div>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <div className="font-bold text-green-600">{batchProgress.completed}</div>
                  <div className="text-green-800">Completed</div>
                </div>
                <div className="bg-red-50 p-2 rounded">
                  <div className="font-bold text-red-600">{batchProgress.failed}</div>
                  <div className="text-red-800">Failed</div>
                </div>
              </div>

              {/* Completion Actions */}
              {batchProgress.overallProgress === 100 && (
                <div className="pt-4 border-t">
                  {batchProgress.failed === 0 ? (
                    <Alert type="success">
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      All images processed successfully!
                    </Alert>
                  ) : (
                    <Alert type="warning">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      Processing completed with {batchProgress.failed} failures.
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
