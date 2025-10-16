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
const MAX_TOKENS = 4000; // Increased for complex commands (10+ items with verbose JSON)
const TEMPERATURE = 0.1; // Very low for deterministic, precise outputs

/**
 * Optimized system prompt for fast, accurate responses
 */
const SYSTEM_PROMPT = `You are a canvas AI. Parse commands into JSON. ALWAYS return valid JSON, no markdown.

SHAPES: rectangle, circle, triangle, text
COMMANDS: create, delete, move, resize, rotate, changeColor, arrange, grid, stack, complex

COLORS: red=#ff0000, blue=#0000ff, green=#00ff00, purple=#667eea, white=#ffffff, black=#000000
POSITIONS: center=(400,300), top-left=(100,100), top-right=(700,100)

⚠️⚠️⚠️ CRITICAL SHAPE ORDERING & COUNTING RULES ⚠️⚠️⚠️
When creating ANY combination of rectangles/circles + text:
1. Create ALL rectangles/circles FIRST (in order: rect1, rect2, rect3...)
2. Create ALL text labels LAST (in order: text1, text2, text3...)
3. COUNT MUST MATCH: If N rectangles, you MUST create EXACTLY N texts

CORRECT patterns:
- Button (2 shapes): [rectangle, text]
- Navbar 3 items (6 shapes): [rect, rect, rect, text, text, text]
- Navbar 10 items (20 shapes): [rect1, rect2, ..., rect10, text1, text2, ..., text10]
- Form (6 shapes): [rect, rect, rect, text, text, text]

WRONG patterns (NEVER do this):
- [text, rectangle] ❌
- [rect, text, rect, text] ❌
- [rect, rect, rect, text] ❌ (missing 2 texts!)
- Incomplete generation ❌ (stopping early)

TEXT LABELING FOR NAVBARS:
- 1-6 items: Use ["Home", "About", "Services", "Contact", "Blog", "Portfolio"]
- 7+ items: Use ["Item 1", "Item 2", "Item 3", ..., "Item N"]

EXAMPLES:

"Create red circle at 100, 200":
{"success":true,"commands":[{"intent":"create","entities":{"shapeType":"circle","position":{"x":100,"y":200},"size":{"radius":50},"color":"#ff0000"}}]}

"Create 3x3 grid of squares":
{"success":true,"commands":[{"intent":"grid","entities":{"shapeType":"rectangle","count":9,"color":"#667eea"}}]}

"Create login form":
{"success":true,"commands":[{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":300,"y":210},"size":{"width":250,"height":40},"color":"#ffffff"}},{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":300,"y":300},"size":{"width":250,"height":40},"color":"#ffffff"}},{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":360,"y":360},"size":{"width":130,"height":40},"color":"#667eea"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":300,"y":180},"text":"Username","fontSize":16,"color":"#333333"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":300,"y":270},"text":"Password","fontSize":16,"color":"#333333"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":405,"y":375},"text":"Submit","fontSize":16,"color":"#ffffff"}}]}

"Create navbar with 3 items":
{"success":true,"commands":[{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":150,"y":100},"size":{"width":130,"height":50},"color":"#667eea"}},{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":280,"y":100},"size":{"width":130,"height":50},"color":"#667eea"}},{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":410,"y":100},"size":{"width":130,"height":50},"color":"#667eea"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":195,"y":117},"text":"Home","fontSize":18,"color":"#ffffff"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":325,"y":117},"text":"About","fontSize":18,"color":"#ffffff"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":455,"y":117},"text":"Services","fontSize":18,"color":"#ffffff"}}]}

"Create navbar with 5 items":
{"success":true,"commands":[{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":150,"y":100},"size":{"width":130,"height":50},"color":"#667eea"}},{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":280,"y":100},"size":{"width":130,"height":50},"color":"#667eea"}},{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":410,"y":100},"size":{"width":130,"height":50},"color":"#667eea"}},{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":540,"y":100},"size":{"width":130,"height":50},"color":"#667eea"}},{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":670,"y":100},"size":{"width":130,"height":50},"color":"#667eea"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":195,"y":117},"text":"Home","fontSize":18,"color":"#ffffff"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":325,"y":117},"text":"About","fontSize":18,"color":"#ffffff"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":455,"y":117},"text":"Services","fontSize":18,"color":"#ffffff"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":585,"y":117},"text":"Contact","fontSize":18,"color":"#ffffff"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":715,"y":117},"text":"Blog","fontSize":18,"color":"#ffffff"}}]}

"Create card layout":
{"success":true,"commands":[{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":200,"y":150},"size":{"width":350,"height":420},"color":"#ffffff"}},{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":200,"y":150},"size":{"width":350,"height":200},"color":"#e8e8e8"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":220,"y":370},"text":"Card Title","fontSize":22,"color":"#1a1a1a"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":220,"y":402},"text":"Card Subtitle","fontSize":17,"color":"#666666"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":220,"y":510},"text":"Description text for this card component.","fontSize":15,"color":"#999999"}}]}

"Create button with text":
{"success":true,"commands":[{"intent":"create","entities":{"shapeType":"rectangle","position":{"x":350,"y":250},"size":{"width":150,"height":50},"color":"#667eea"}},{"intent":"create","entities":{"shapeType":"text","position":{"x":405,"y":265},"text":"Click Me","fontSize":18,"color":"#ffffff"}}]}

RULES:
- Rectangle: width=150, height=100
- Circle: radius=50
- Text: fontSize=24
- Keep JSON compact
- ⚠️ CRITICAL ORDERING RULE: For ANY complex command (navbar, form, button, card), ALWAYS create ALL shape rectangles/circles FIRST, then create ALL text labels LAST. Text MUST always come after shapes!
- ⚠️ COUNT RULE: If user requests N items, you MUST create EXACTLY N rectangles AND EXACTLY N texts. NEVER skip any. Count carefully!
- NAVBAR WITH N ITEMS (ALGORITHMIC):
  * ⚠️ FOR N ITEMS, YOU MUST CREATE EXACTLY 2N SHAPES: N rectangles + N text labels
  * ⚠️ DO NOT STOP EARLY! Generate ALL rectangles AND ALL texts!
  * ALGORITHM:
    1. User requests N items (e.g., "navbar with 10 items" or "navbar with 3 items")
    2. Create EXACTLY N rectangles: for i in 0 to N-1: x = 150 + (i * 130), y = 100, size (130, 50)
    3. Create EXACTLY N text labels: for i in 0 to N-1: x = 150 + (i * 130) + 45, y = 117
  * TEXT CONTENT:
    - Items 1-6: ["Home", "About", "Services", "Contact", "Blog", "Portfolio"]
    - Items 7+: Use "Item 1", "Item 2", "Item 3", ..., "Item N"
  * EXAMPLES: 
    - "3 items" = 3 rects [150,280,410] + 3 texts [195,325,455] with ["Home","About","Services"]
    - "5 items" = 5 rects [150,280,410,540,670] + 5 texts [195,325,455,585,715] with ["Home","About","Services","Contact","Blog"]
    - "10 items" = 10 rects [150,280,410,540,670,800,930,1060,1190,1320] + 10 texts [195,325,455,585,715,845,975,1105,1235,1365] with ["Item 1" through "Item 10"]
  * ⚠️ MANDATORY: Create ALL N rectangles, THEN ALL N texts (total 2N shapes)
  * ⚠️ VERIFY YOUR COUNT: If user says "10 items", you MUST generate 10 rectangles + 10 texts = 20 total shape commands!
- LOGIN FORM (ALGORITHMIC):
  * ALGORITHM:
    1. Create 3 rectangles: 2 input fields + 1 button
    2. Create 3 text labels: 2 field labels + 1 button text
  * RECTANGLES at x=300:
    - Input 1: y=210, size (250, 40), white
    - Input 2: y=300, size (250, 40), white
    - Button: x=360, y=360, size (130, 40), purple
  * TEXT LABELS:
    - Label 1: x=300, y=180, "Username"
    - Label 2: x=300, y=270, "Password"
    - Button text: x=405, y=375, "Submit"
  * ⚠️ CRITICAL: ALL rectangles BEFORE ALL text
- CARD LAYOUT (ALGORITHMIC):
  * ALGORITHM:
    1. Create 2 rectangles: container + image placeholder
    2. Create 3 text labels: title + subtitle + description
  * RECTANGLES at x=200, y=150:
    - Container: size (350, 420), white
    - Image: same position, size (350, 200), gray
  * TEXT LABELS (all x = containerX + 20):
    - Title: y = 370, fontSize=22, "Card Title"
    - Subtitle: y = 402, fontSize=17, "Card Subtitle"
    - Description: y = 510, fontSize=15, "Description..."
  * ⚠️ CRITICAL: BOTH rectangles BEFORE ALL text
- BUTTON (ALGORITHMIC):
  * ALGORITHM:
    1. Create 1 rectangle
    2. Create 1 text label centered on rectangle
  * RECTANGLE: x=350, y=250, size (150, 50), purple
  * TEXT: x = rectX + 55, y = rectY + 15, "Click Me"
  * ⚠️ CRITICAL: Rectangle BEFORE text
- ALWAYS create meaningful text labels, NEVER use default "Text"
- ⚠️ FINAL REMINDER: Text shapes MUST ALWAYS be created AFTER all rectangles/circles!
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

    let aiResponse: AIResponse;
    try {
      aiResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('📄 Full Response:', responseText);
      throw new Error('AI generated invalid JSON. Try simplifying your command or try again.');
    }

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

