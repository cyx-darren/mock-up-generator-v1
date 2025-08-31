'use client';

import React, { useState, useCallback } from 'react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  description?: string;
  component: React.ReactNode;
  isValid?: boolean;
  canSkip?: boolean;
}

interface MultiStepWizardProps {
  steps: Step[];
  onComplete: () => void;
  onCancel?: () => void;
  className?: string;
  showStepNumbers?: boolean;
  allowSkip?: boolean;
  saveOnStepChange?: (currentStep: number, data: any) => void;
}

export function MultiStepWizard({
  steps,
  onComplete,
  onCancel,
  className,
  showStepNumbers = true,
  allowSkip = false,
  saveOnStepChange,
}: MultiStepWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const canGoNext = useCallback(() => {
    const step = steps[currentStep];
    return step.isValid !== false || step.canSkip === true || allowSkip;
  }, [currentStep, steps, allowSkip]);

  const canGoPrevious = useCallback(() => {
    return currentStep > 0;
  }, [currentStep]);

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (!canGoNext()) return;

    // Save current step data if handler provided
    if (saveOnStepChange) {
      saveOnStepChange(currentStep, null); // Data would come from context or ref
    }

    if (isLastStep) {
      onComplete();
    } else {
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious()) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow clicking on completed steps or the next immediate step
    if (stepIndex <= currentStep || completedSteps.has(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.has(stepIndex)) return 'completed';
    if (stepIndex === currentStep) return 'current';
    if (stepIndex < currentStep) return 'completed';
    return 'upcoming';
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isClickable = index <= currentStep || completedSteps.has(index);
            
            return (
              <div key={step.id} className="flex items-center">
                {/* Step Circle */}
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium transition-all duration-200',
                    {
                      'border-blue-500 bg-blue-500 text-white': status === 'current',
                      'border-green-500 bg-green-500 text-white': status === 'completed',
                      'border-gray-300 bg-white text-gray-500': status === 'upcoming',
                      'cursor-pointer hover:border-blue-400': isClickable,
                    }
                  )}
                  onClick={() => isClickable && handleStepClick(index)}
                >
                  {status === 'completed' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : showStepNumbers ? (
                    index + 1
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-current" />
                  )}
                </div>

                {/* Step Label */}
                <div className="ml-3 hidden sm:block">
                  <p
                    className={cn('text-sm font-medium', {
                      'text-blue-600': status === 'current',
                      'text-green-600': status === 'completed',
                      'text-gray-500': status === 'upcoming',
                    })}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500">{step.description}</p>
                  )}
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4 transition-colors duration-200',
                      {
                        'bg-green-500': completedSteps.has(index),
                        'bg-gray-300': !completedSteps.has(index),
                      }
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {steps[currentStep].title}
          </h2>
          {steps[currentStep].description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {steps[currentStep].description}
            </p>
          )}
        </div>
        
        <div className="min-h-[400px]">
          {steps[currentStep].component}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <div>
          {onCancel && isFirstStep && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {!isFirstStep && (
            <Button variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {!isLastStep && allowSkip && !canGoNext() && (
            <Button variant="ghost" onClick={handleNext}>
              Skip
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            disabled={!canGoNext() && !allowSkip}
            variant={isLastStep ? 'primary' : 'primary'}
          >
            {isLastStep ? 'Complete' : 'Next'}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
        <div className="text-center mt-2 text-sm text-gray-500">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>
    </div>
  );
}

export type { Step };