'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export interface AdjustmentHistory {
  id: string;
  instruction: string;
  enhancedPrompt: string;
  mockupUrl: string;
  timestamp: Date;
}

interface PromptAdjusterProps {
  onApplyChanges: (instruction: string, enhancedPrompt: string) => Promise<void>;
  loading: boolean;
  history: AdjustmentHistory[];
  onRevertToVersion: (historyItem: AdjustmentHistory) => void;
}

const QUICK_PROMPTS = [
  { label: 'Make Bigger', instruction: 'make it bigger' },
  { label: 'Maximum Size', instruction: 'make it as big as possible' },
  { label: 'Make Smaller', instruction: 'make it smaller' },
  { label: 'Move Left', instruction: 'move it to the left' },
  { label: 'Move Right', instruction: 'move it to the right' },
  { label: 'Move Up', instruction: 'move it higher' },
  { label: 'Move Down', instruction: 'move it lower' },
  { label: 'Center It', instruction: 'center it perfectly' },
  { label: 'More Prominent', instruction: 'make it more prominent' },
  { label: 'More Subtle', instruction: 'make it more subtle' },
];

export function PromptAdjuster({
  onApplyChanges,
  loading,
  history,
  onRevertToVersion,
}: PromptAdjusterProps) {
  const [instruction, setInstruction] = useState('');

  const enhancePrompt = (userInstruction: string): string => {
    const lowercaseInstruction = userInstruction.toLowerCase();

    // Handle constraint-aware size adjustments with visual constraint reference
    if (lowercaseInstruction.includes('bigger') || lowercaseInstruction.includes('larger')) {
      if (
        lowercaseInstruction.includes('as big as possible') ||
        lowercaseInstruction.includes('biggest') ||
        lowercaseInstruction.includes('maximum') ||
        lowercaseInstruction.includes('max size')
      ) {
        return 'Make the logo as large as possible to fill the entire GREEN AREA shown in the constraint image. The logo should expand to use the full width and height of the green zone while maintaining its aspect ratio. Do not place any part of the logo outside the green boundaries.';
      }
      return 'Increase the logo size significantly (make it 50% bigger) while keeping it entirely within the GREEN AREA shown in the constraint image. The logo must not extend outside the green boundaries.';
    }

    if (lowercaseInstruction.includes('smaller') || lowercaseInstruction.includes('reduce')) {
      if (
        lowercaseInstruction.includes('as small as possible') ||
        lowercaseInstruction.includes('smallest') ||
        lowercaseInstruction.includes('minimum') ||
        lowercaseInstruction.includes('min size')
      ) {
        return 'Make the logo as small as possible while still being clearly visible, keeping it centered within the GREEN AREA shown in the constraint image.';
      }
      return 'Reduce the logo size by 30% while keeping it within the GREEN AREA shown in the constraint image.';
    }

    // Smart prompt enhancement mapping for other adjustments with visual constraint reference
    const enhancements: Record<string, string> = {
      left: 'Move the logo to the LEFT side of the GREEN AREA shown in the constraint image',
      right: 'Move the logo to the RIGHT side of the GREEN AREA shown in the constraint image',
      'move it to the left':
        'Move the logo to the LEFT side of the GREEN AREA shown in the constraint image',
      'move it to the right':
        'Move the logo to the RIGHT side of the GREEN AREA shown in the constraint image',
      'move it higher':
        'Move the logo to the TOP part of the GREEN AREA shown in the constraint image',
      'move it lower':
        'Move the logo to the BOTTOM part of the GREEN AREA shown in the constraint image',
      up: 'Move the logo to the TOP part of the GREEN AREA shown in the constraint image',
      down: 'Move the logo to the BOTTOM part of the GREEN AREA shown in the constraint image',
      'center it perfectly':
        'Position the logo at the EXACT CENTER of the GREEN AREA shown in the constraint image',
      center: 'Position the logo at the CENTER of the GREEN AREA shown in the constraint image',
      'rotate it clockwise': 'Rotate the logo 15 degrees clockwise within the GREEN AREA',
      'rotate it counter-clockwise':
        'Rotate the logo 15 degrees counter-clockwise within the GREEN AREA',
      'more prominent':
        'Make the logo more prominent and eye-catching while keeping it entirely within the GREEN AREA shown in the constraint image',
      'more subtle':
        'Make the logo blend more naturally with the product surface while staying within the GREEN AREA',
      subtle:
        'Make the logo blend more naturally with the product surface while staying within the GREEN AREA',
      prominent:
        'Make the logo more prominent and eye-catching while keeping it entirely within the GREEN AREA shown in the constraint image',
    };

    // Check for exact matches first
    if (enhancements[lowercaseInstruction]) {
      return enhancements[lowercaseInstruction];
    }

    // Check for partial matches
    for (const [key, enhancement] of Object.entries(enhancements)) {
      if (lowercaseInstruction.includes(key)) {
        return enhancement;
      }
    }

    // Return enhanced instruction that references the visual constraint
    return `${userInstruction} - IMPORTANT: Keep the logo entirely within the GREEN AREA shown in the constraint image. The green zone represents the allowed placement area.`;
  };

  const handleQuickPrompt = (promptInstruction: string) => {
    setInstruction(promptInstruction);
  };

  const handleApplyChanges = async () => {
    if (!instruction.trim()) return;

    const enhancedPrompt = enhancePrompt(instruction);
    await onApplyChanges(instruction, enhancedPrompt);
    setInstruction('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <h4 className="font-medium text-gray-700 dark:text-gray-300 text-lg">Refine Your Mockup</h4>

      {/* Text Input */}
      <div className="space-y-3">
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Describe how you'd like to adjust the logo (e.g., 'make it bigger', 'move it to the left', 'rotate it 45 degrees')"
          className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
          rows={3}
          disabled={loading}
        />

        <Button
          onClick={handleApplyChanges}
          disabled={loading || !instruction.trim()}
          className="w-full"
        >
          {loading ? 'Applying Changes...' : 'Apply Changes'}
        </Button>
      </div>

      {/* Quick Prompt Buttons */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Quick Adjustments:</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <Button
              key={prompt.label}
              variant="outline"
              size="sm"
              onClick={() => handleQuickPrompt(prompt.instruction)}
              disabled={loading}
              className="text-xs"
            >
              {prompt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Adjustment History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Recent Adjustments:
          </p>
          <div className="flex flex-wrap gap-2">
            {/* Show last 3 adjustments */}
            {history
              .slice(-3)
              .reverse()
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => onRevertToVersion(item)}
                  disabled={loading}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors disabled:opacity-50"
                >
                  &quot;{item.instruction}&quot;
                </button>
              ))}
            {/* Original version button */}
            <button
              onClick={() =>
                onRevertToVersion({
                  id: 'original',
                  instruction: 'Original',
                  enhancedPrompt: '',
                  mockupUrl: '',
                  timestamp: new Date(),
                })
              }
              disabled={loading}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-colors disabled:opacity-50"
            >
              Original
            </button>
          </div>
        </div>
      )}

      {/* Usage Tips */}
      <Alert variant="info">
        <div className="text-sm space-y-2">
          <p className="font-medium">Pro Tips:</p>
          <ul className="space-y-1 text-xs">
            <li>
              • Be specific: &quot;make it 20% bigger&quot; works better than just
              &quot;bigger&quot;
            </li>
            <li>
              • Try creative adjustments: &quot;add a subtle glow&quot; or &quot;make it look more
              premium&quot;
            </li>
            <li>
              • You can combine instructions: &quot;make it bigger and move it to the upper
              right&quot;
            </li>
          </ul>
        </div>
      </Alert>
    </div>
  );
}
