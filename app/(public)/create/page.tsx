'use client';

import { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function CreateMockupPage() {
  const [step, setStep] = useState(1);

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
              <div>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Upload your company logo or design
                </p>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center mb-6">
                  <p className="text-gray-600 dark:text-gray-400">
                    Drag and drop your logo here, or click to browse
                  </p>
                  <Input type="file" className="mt-4" accept="image/*" />
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)}>Continue</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Choose placement and generate your mockup
                </p>
                <div className="space-y-4 mb-6">
                  <label className="flex items-center space-x-3">
                    <input type="radio" name="placement" className="text-blue-600" />
                    <span className="text-gray-700 dark:text-gray-300">Horizontal Placement</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="radio" name="placement" className="text-blue-600" />
                    <span className="text-gray-700 dark:text-gray-300">Vertical Placement</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="radio" name="placement" className="text-blue-600" />
                    <span className="text-gray-700 dark:text-gray-300">All-Over Print</span>
                  </label>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button variant="success">Generate Mockup</Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
