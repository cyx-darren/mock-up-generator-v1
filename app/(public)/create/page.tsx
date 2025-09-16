'use client';

import { useState, useCallback } from 'react';
import { Container } from '@/components/layout/Container';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LogoAdjustmentInterface, PreviewEnhancements, LogoTransform } from '@/components/lazy';

export default function CreateMockupPage() {
  const [step, setStep] = useState(1);
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [generatedMockup, setGeneratedMockup] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoTransform, setLogoTransform] = useState<LogoTransform>({
    x: 200,
    y: 200,
    width: 100,
    height: 100,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
  });

  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleTransformChange = useCallback((transform: LogoTransform) => {
    setLogoTransform(transform);
  }, []);

  const handleGenerateMockup = useCallback(async () => {
    if (!uploadedLogo) return;

    setIsGenerating(true);

    // Simulate mockup generation (in real app, this would call the API)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API delay
      // For demo purposes, use the uploaded logo as the "generated mockup"
      setGeneratedMockup(uploadedLogo);
    } catch (error) {
      console.error('Failed to generate mockup:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [uploadedLogo]);

  return (
    <Container className="py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
          Create Your Mockup
        </h1>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}
            >
              1
            </div>
            <div
              className={`w-24 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
            />
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 2
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}
            >
              2
            </div>
            <div
              className={`w-24 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
            />
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 3
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}
            >
              3
            </div>
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Select Product'}
              {step === 2 && 'Upload Your Logo'}
              {step === 3 && 'Generate Mockup'}
            </CardTitle>
          </CardHeader>
          <CardBody>
            {step === 1 && (
              <div>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Choose a product from our catalog to customize
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-600"
                    />
                  ))}
                </div>
                <Button onClick={() => setStep(2)}>Continue</Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <p className="text-gray-700 dark:text-gray-300">
                  Upload your company logo and adjust its placement
                </p>

                {!uploadedLogo ? (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Drag and drop your logo here, or click to browse
                    </p>
                    <Input
                      type="file"
                      className="mt-4"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Logo Preview */}
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={uploadedLogo}
                          alt="Uploaded logo"
                          className="w-16 h-16 object-contain border border-gray-200 dark:border-gray-700 rounded"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            Logo uploaded successfully
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUploadedLogo(null)}
                            className="mt-2"
                          >
                            Change Logo
                          </Button>
                        </div>
                      </div>

                      {/* Logo Adjustment Interface */}
                      <LogoAdjustmentInterface
                        logoSrc={uploadedLogo}
                        canvasWidth={400}
                        canvasHeight={400}
                        onTransformChange={handleTransformChange}
                        className="mt-6"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!uploadedLogo}>
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <p className="text-gray-700 dark:text-gray-300">
                  Review your logo placement and generate your mockup
                </p>

                {/* Logo Summary */}
                {uploadedLogo && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Logo Configuration
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Position:</span>
                        <span className="ml-2 font-medium">
                          X: {Math.round(logoTransform.x)}, Y: {Math.round(logoTransform.y)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Size:</span>
                        <span className="ml-2 font-medium">
                          {logoTransform.width} × {logoTransform.height}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Rotation:</span>
                        <span className="ml-2 font-medium">{logoTransform.rotation}°</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Opacity:</span>
                        <span className="ml-2 font-medium">
                          {Math.round(logoTransform.opacity * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Placement Options */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Placement Style</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="placement"
                        className="text-blue-600"
                        defaultChecked
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        Custom Position (as adjusted)
                      </span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="radio" name="placement" className="text-blue-600" />
                      <span className="text-gray-700 dark:text-gray-300">Horizontal Tiled</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="radio" name="placement" className="text-blue-600" />
                      <span className="text-gray-700 dark:text-gray-300">Vertical Tiled</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="radio" name="placement" className="text-blue-600" />
                      <span className="text-gray-700 dark:text-gray-300">All-Over Pattern</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back to Adjust
                  </Button>
                  {!generatedMockup ? (
                    <Button
                      variant="success"
                      onClick={handleGenerateMockup}
                      disabled={isGenerating}
                    >
                      {isGenerating ? 'Generating...' : 'Generate Mockup'}
                    </Button>
                  ) : (
                    <Button variant="success" disabled>
                      ✓ Mockup Generated
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Preview Enhancements - Show after mockup is generated */}
        {generatedMockup && step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview & Enhance Your Mockup</CardTitle>
            </CardHeader>
            <CardBody>
              <PreviewEnhancements
                mockupUrl={generatedMockup}
                productName="Corporate Gift Item"
                className="mt-6"
              />
            </CardBody>
          </Card>
        )}
      </div>
    </Container>
  );
}
