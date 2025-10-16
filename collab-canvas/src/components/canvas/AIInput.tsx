import React, { useState, useCallback, useRef, useEffect } from 'react';
import './AIInput.css';

interface AIInputProps {
  onSubmit: (command: string) => Promise<{ success: boolean; message: string }>;
  isProcessing: boolean;
  lastError: string | null;
}

export const AIInput: React.FC<AIInputProps> = React.memo(({ onSubmit, isProcessing, lastError }) => {
  const [input, setInput] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isProcessing) return;

    const command = input.trim();
    setInput(''); // Clear immediately for better UX

    const result = await onSubmit(command);

    // Show feedback
    setFeedbackMessage(result.message);
    setFeedbackType(result.success ? 'success' : 'error');
    setShowFeedback(true);

    // Auto-hide feedback after 3 seconds
    setTimeout(() => setShowFeedback(false), 3000);
  }, [input, isProcessing, onSubmit]);

  // Handle key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Show error feedback when lastError changes
  useEffect(() => {
    if (lastError) {
      setFeedbackMessage(lastError);
      setFeedbackType('error');
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 3000);
    }
  }, [lastError]);

  return (
    <div className="ai-input-container">
      <div className="ai-input-wrapper">
        <span className="ai-input-icon">🤖</span>
        <input
          ref={inputRef}
          type="text"
          className="ai-input-field"
          placeholder="Ask AI to create or edit shapes..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
        />
        <button
          className={`ai-input-submit ${isProcessing ? 'processing' : ''}`}
          onClick={handleSubmit}
          disabled={!input.trim() || isProcessing}
          title="Submit command (Enter)"
        >
          {isProcessing ? (
            <span className="spinner">⏳</span>
          ) : (
            <span>→</span>
          )}
        </button>
      </div>
      
      {showFeedback && (
        <div className={`ai-feedback ${feedbackType}`}>
          <span className="ai-feedback-icon">
            {feedbackType === 'success' ? '✓' : '✗'}
          </span>
          <span className="ai-feedback-text">{feedbackMessage}</span>
        </div>
      )}
    </div>
  );
});

AIInput.displayName = 'AIInput';

