import OpenAI from 'openai';
import type { AIResponse, CanvasObject } from './types';

/**
 * OpenAI client instance
 * Using GPT-3.5 Turbo for cost-effective testing
 * Easy upgrade to GPT-4 by changing model string
 */
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Client-side usage (API key not exposed in production)
});

// Model configuration
const MODEL = 'gpt-4-turbo'; // Better instruction following and JSON adherence
const MAX_TOKENS = 800; // Reduced for faster responses
const TEMPERATURE = 0.1; // Very low for deterministic, precise outputs

/**
 * Optimized system prompt for fast, accurate responses
 */
const SYSTEM_PROMPT = `You are a canvas AI. Parse commands into JSON. ALWAYS return valid JSON, no markdown.

SHAPES: rectangle, circle, triangle, text
COMMANDS: create, delete, move, resize, rotate, changeColor, arrange, grid, stack, complex

COLORS: red=#ff0000, blue=#0000ff, green=#00ff00, purple=#667eea, white=#ffffff, black=#000000
POSITIONS: center=(400,300), top-left=(100,100), top-right=(700,100)

EXAMPLES:

"Create red circle at 100, 200":
{"success":true,"commands":[{"intent":"create","entities":{"shapeType":"circle","position":{"x":100,"y":200},"size":{"radius":50},"color":"#ff0000"}}]}

"Create 3x3 grid of squares":
{"success":true,"commands":[{"intent":"grid","entities":{"shapeType":"rectangle","count":9,"color":"#667eea"}}]}

"Create login form":
{"success":true,"commands":[{"intent":"create","entities":{"shapeType":"text","position":{"x":300,"y":180},"text":"Username","fontSize":16,"color":"#333333"}},{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":300,"y":210},"size":{"width":250,"height":40},"color":"#ffffff"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":300,"y":270},"text":"Password","fontSize":16,"color":"#333333"}},{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":300,"y":300},"size":{"width":250,"height":40},"color":"#ffffff"}},{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":360,"y":360},"size":{"width":130,"height":40},"color":"#667eea"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":405,"y":375},"text":"Login","fontSize":16,"color":"#ffffff"}}]}

"Create navbar with 4 items":
{"success":true,"commands":[{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":150,"y":100},"size":{"width":130,"height":50},"color":"#667eea"}},{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":300,"y":100},"size":{"width":130,"height":50},"color":"#667eea"}},{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":450,"y":100},"size":{"width":130,"height":50},"color":"#667eea"}},{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":600,"y":100},"size":{"width":130,"height":50},"color":"#667eea"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":185,"y":117},"text":"Home","fontSize":18,"color":"#ffffff"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":335,"y":117},"text":"About","fontSize":18,"color":"#ffffff"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":485,"y":117},"text":"Services","fontSize":18,"color":"#ffffff"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":635,"y":117},"text":"Contact","fontSize":18,"color":"#ffffff"}}]}

RULES:
- Rectangle: width=150, height=100
- Circle: radius=50
- Text: fontSize=24
- Keep JSON compact
- NAVBAR WITH N ITEMS: Create EXACTLY N rectangles + N text labels (2N shapes total)
  * CRITICAL: Create ALL rectangles first, THEN ALL text labels (for proper layering)
  * Pattern: rect1, rect2, rect3, rect4, THEN text1, text2, text3, text4
  * Rectangle: 130x50, X increases by 150px each (20px gap between)
  * Text: positioned at (Rect.X + 35, Rect.Y + 17) for centering
  * Text labels: "Home", "About", "Services", "Contact", "Blog", "Portfolio", etc.
- FORM: Text labels above input rectangles, button rectangle with centered text
- ALWAYS create meaningful text labels, NEVER use default "Text"
- ONLY return JSON, no explanations`;

/**
 * Parse natural language command into structured AI response
 */
export async function parseCommand(
  userInput: string,
  canvasShapes: CanvasObject[],
  selectedShapeIds: string[]
): Promise<AIResponse> {
  try {
    // Validate API key
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      return {
        success: false,
        commands: [],
        error: 'OpenAI API key not configured. Add VITE_OPENAI_API_KEY to your .env.local file.',
        suggestions: ['Get your API key from https://platform.openai.com/api-keys']
      };
    }

    // Build context about current canvas state
    const contextInfo = buildCanvasContext(canvasShapes, selectedShapeIds);

    // Call OpenAI API with JSON mode
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
      response_format: { type: 'json_object' }, // Force JSON output
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `${contextInfo}\n\nUser command: "${userInput}"` }
      ],
    });

    // Parse response
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    const aiResponse: AIResponse = JSON.parse(responseText);

    // Validate response structure
    if (!aiResponse.commands || !Array.isArray(aiResponse.commands)) {
      throw new Error('Invalid response format: missing commands array');
    }

    // Add confidence scores (based on model response)
    aiResponse.commands = aiResponse.commands.map(cmd => ({
      ...cmd,
      confidence: 0.9, // GPT-3.5/4 is generally confident, adjust if needed
    }));

    console.log('🤖 AI Response:', aiResponse);
    return aiResponse;

  } catch (error) {
    console.error('❌ AI Provider Error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return {
          success: false,
          commands: [],
          error: 'Invalid API key. Please check your .env.local configuration.',
        };
      }
      
      if (error.message.includes('rate limit')) {
        return {
          success: false,
          commands: [],
          error: 'Rate limit exceeded. Please wait a moment and try again.',
        };
      }
    }

    return {
      success: false,
      commands: [],
      error: 'Failed to process command. Please try again.',
      suggestions: [
        'Try: "Create a red circle"',
        'Try: "Move all shapes to the center"',
        'Try: "Create a 3x3 grid of squares"'
      ]
    };
  }
}

/**
 * Build context string about current canvas state
 */
function buildCanvasContext(shapes: CanvasObject[], selectedIds: string[]): string {
  const shapeCount = shapes.length;
  const selectedCount = selectedIds.length;
  
  let context = `Canvas has ${shapeCount} shape(s).`;
  
  if (selectedCount > 0) {
    context += ` ${selectedCount} shape(s) currently selected.`;
    
    // Add info about selected shapes for context-aware commands
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    if (selectedShapes.length > 0) {
      const shapeTypes = selectedShapes.map(s => s.type).join(', ');
      context += ` Selected: ${shapeTypes}.`;
    }
  }
  
  // Add info about shape distribution (for relative positioning)
  if (shapeCount > 0) {
    const types = shapes.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const typeSummary = Object.entries(types)
      .map(([type, count]) => `${count} ${type}(s)`)
      .join(', ');
    context += ` Contains: ${typeSummary}.`;
  }
  
  return context;
}

/**
 * Test connection to OpenAI API
 */
export async function testConnection(): Promise<boolean> {
  try {
    const response = await parseCommand('test', [], []);
    return response.success || response.error?.includes('API key') === false;
  } catch {
    return false;
  }
}

