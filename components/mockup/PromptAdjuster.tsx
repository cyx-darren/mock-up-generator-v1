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

    // Handle constraint-aware size adjustments
    if (lowercaseInstruction.includes('bigger') || lowercaseInstruction.includes('larger')) {
      if (
        lowercaseInstruction.includes('as big as possible') ||
        lowercaseInstruction.includes('biggest') ||
        lowercaseInstruction.includes('maximum') ||
        lowercaseInstruction.includes('max size')
      ) {
        return 'scale the logo to the maximum size that fits within the green constraint area, using the full width and height available while maintaining aspect ratio and leaving minimal padding from the constraint boundaries';
      }
      return 'increase the logo size by 50% while ensuring it stays within the constraint area boundaries';
    }

    if (lowercaseInstruction.includes('smaller') || lowercaseInstruction.includes('reduce')) {
      if (
        lowercaseInstruction.includes('as small as possible') ||
        lowercaseInstruction.includes('smallest') ||
        lowercaseInstruction.includes('minimum') ||
        lowercaseInstruction.includes('min size')
      ) {
        return 'scale the logo to the minimum readable size within the constraint area';
      }
      return 'decrease the logo size by 30% while maintaining visibility';
    }

    // Smart prompt enhancement mapping for other adjustments
    const enhancements: Record<string, string> = {
      left: 'position the logo towards the left side of the constraint area',
      right: 'position the logo towards the right side of the constraint area',
      'move it to the left': 'position the logo towards the left side of the constraint area',
      'move it to the right': 'position the logo towards the right side of the constraint area',
      'move it higher': 'position the logo higher within the constraint area',
      'move it lower': 'position the logo lower within the constraint area',
      up: 'position the logo higher within the constraint area',
      down: 'position the logo lower within the constraint area',
      'center it perfectly': 'position the logo at the exact center of the constraint area',
      center: 'position the logo at the center of the constraint area',
      'rotate it clockwise': 'rotate the logo 15 degrees clockwise',
      'rotate it counter-clockwise': 'rotate the logo 15 degrees counter-clockwise',
      'more prominent':
        'make the logo more prominent and eye-catching while respecting constraint boundaries',
      'more subtle': 'make the logo blend more naturally with the product surface',
      subtle: 'make the logo blend more naturally with the product surface',
      prominent:
        'make the logo more prominent and eye-catching while respecting constraint boundaries',
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

    // Return enhanced instruction that mentions constraint awareness
    return `${userInstruction} while ensuring the logo stays within the defined constraint area`;
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
