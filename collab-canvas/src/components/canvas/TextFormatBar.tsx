import './TextFormatBar.css';

interface TextFormatBarProps {
  fontSize: number;
  fontStyle: 'normal' | 'bold' | 'italic' | 'bold italic';
  onFontSizeChange: (size: number) => void;
  onBoldToggle: () => void;
  onItalicToggle: () => void;
}

const FONT_SIZES = [12, 16, 20, 24, 32, 40, 48, 64, 72, 96];

export default function TextFormatBar({
  fontSize,
  fontStyle,
  onFontSizeChange,
  onBoldToggle,
  onItalicToggle,
}: TextFormatBarProps) {
  const isBold = fontStyle === 'bold' || fontStyle === 'bold italic';
  const isItalic = fontStyle === 'italic' || fontStyle === 'bold italic';

  return (
    <div className="text-format-bar">
      <div className="format-group">
        <label className="format-label">Font Size</label>
        <select
          className="font-size-select"
          value={fontSize}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
      </div>

      <div className="format-divider" />

      <div className="format-group">
        <button
          className={`format-button ${isBold ? 'active' : ''}`}
          onClick={onBoldToggle}
          title="Bold (Ctrl+B)"
        >
          <span className="format-icon bold">B</span>
        </button>
        <button
          className={`format-button ${isItalic ? 'active' : ''}`}
          onClick={onItalicToggle}
          title="Italic (Ctrl+I)"
        >
          <span className="format-icon italic">I</span>
        </button>
      </div>
    </div>
  );
}

