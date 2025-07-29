const express = require('express');
const { auth } = require('../middleware/auth');
const { setCache, getCache } = require('../config/redis');

const router = express.Router();

// Component generation prompt template
const generateComponentPrompt = (userPrompt, existingCode = null, chatHistory = []) => {
  let prompt = `You are an expert React developer. Generate a complete React component based on the user's request.

IMPORTANT REQUIREMENTS:
1. Generate a standalone React functional component (no imports needed)
2. Use only React hooks (useState, useEffect) - no external libraries
3. Include all CSS styles in a separate CSS block
4. Make the component self-contained and preview-friendly
5. Use semantic HTML elements and modern design principles
6. Make the component responsive and accessible
7. Use inline styles or CSS classes for styling
8. Do NOT include import statements or export statements
9. The component should work in a browser environment with React 18

User Request: ${userPrompt}

`;

  if (existingCode) {
    prompt += `\nExisting Code:\n${existingCode}\n\nPlease modify/improve the existing code based on the new request.`;
  }

  if (chatHistory.length > 0) {
    prompt += `\n\nPrevious conversation context:\n`;
    chatHistory.slice(-5).forEach(msg => {
      prompt += `${msg.role}: ${msg.content}\n`;
    });
  }

  prompt += `\n\nPlease provide the response in the following JSON format:
{
  "jsx": "// React JSX code here",
  "css": "// CSS styles here",
  "tsx": "// TypeScript version if applicable",
  "explanation": "Brief explanation of the component and its features"
}`;

  return prompt;
};

// Generate component from prompt
router.post('/generate', auth, async (req, res) => {
  try {
    const { prompt, sessionId, existingCode, chatHistory } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check cache first
    const cacheKey = `ai_generate:${Buffer.from(prompt).toString('base64')}`;
    const cachedResult = await getCache(cacheKey);
    
    if (cachedResult) {
      return res.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Generate component using direct Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    const aiPrompt = generateComponentPrompt(prompt, existingCode, chatHistory);
    
    let apiChatHistory = [];
    apiChatHistory.push({ role: "user", parts: [{ text: aiPrompt }] });

    const payload = { contents: apiChatHistory };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${apiResponse.status}`);
    }

    const result = await apiResponse.json();

    let text = '';
    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
      text = result.candidates[0].content.parts[0].text;
    } else {
      throw new Error('No content received from the API.');
    }

    // Parse the response
    let parsedResponse;
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create a basic structure
        parsedResponse = {
          jsx: text,
          css: '',
          tsx: '',
          explanation: 'Generated component based on your request'
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      parsedResponse = {
        jsx: text,
        css: '',
        tsx: '',
        explanation: 'Generated component based on your request'
      };
    }

    // Cache the result
    await setCache(cacheKey, parsedResponse, 3600); // Cache for 1 hour

    res.json({
      success: true,
      data: parsedResponse,
      cached: false
    });

  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate component',
      details: error.message 
    });
  }
});

// Refine existing component
router.post('/refine', auth, async (req, res) => {
  try {
    const { prompt, currentCode, sessionId } = req.body;

    if (!prompt || !currentCode) {
      return res.status(400).json({ error: 'Prompt and current code are required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    const refinePrompt = `You are an expert React developer. Please refine/modify the existing React component based on the user's request.

Current Component Code:
${currentCode.jsx || currentCode}

CSS:
${currentCode.css || ''}

User's Refinement Request: ${prompt}

Please provide the updated component in the same JSON format:
{
  "jsx": "// Updated React JSX code",
  "css": "// Updated CSS styles",
  "tsx": "// Updated TypeScript version if applicable",
  "explanation": "Brief explanation of the changes made"
}

Make sure to preserve the existing functionality while applying the requested changes.`;

    let apiChatHistory = [];
    apiChatHistory.push({ role: "user", parts: [{ text: refinePrompt }] });

    const payload = { contents: apiChatHistory };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${apiResponse.status}`);
    }

    const result = await apiResponse.json();

    let text = '';
    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
      text = result.candidates[0].content.parts[0].text;
    } else {
      throw new Error('No content received from the API.');
    }

    // Parse the response
    let parsedResponse;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = {
          jsx: text,
          css: currentCode.css || '',
          tsx: currentCode.tsx || '',
          explanation: 'Refined component based on your request'
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      parsedResponse = {
        jsx: text,
        css: currentCode.css || '',
        tsx: currentCode.tsx || '',
        explanation: 'Refined component based on your request'
      };
    }

    res.json({
      success: true,
      data: parsedResponse
    });

  } catch (error) {
    console.error('AI refinement error:', error);
    res.status(500).json({ 
      error: 'Failed to refine component',
      details: error.message 
    });
  }
});

// Generate component variations
router.post('/variations', auth, async (req, res) => {
  try {
    const { baseCode, count = 3 } = req.body;

    if (!baseCode) {
      return res.status(400).json({ error: 'Base code is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    const variationsPrompt = `You are an expert React developer. Generate ${count} different variations of the following React component. Each variation should have a different style, layout, or approach while maintaining the same core functionality.

Base Component:
${baseCode.jsx || baseCode}

CSS:
${baseCode.css || ''}

Please provide ${count} variations in the following JSON format:
{
  "variations": [
    {
      "name": "Variation 1 Name",
      "jsx": "// JSX code for variation 1",
      "css": "// CSS for variation 1",
      "description": "Brief description of this variation"
    },
    // ... more variations
  ]
}`;

    let apiChatHistory = [];
    apiChatHistory.push({ role: "user", parts: [{ text: variationsPrompt }] });

    const payload = { contents: apiChatHistory };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${apiResponse.status}`);
    }

    const result = await apiResponse.json();

    let text = '';
    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
      text = result.candidates[0].content.parts[0].text;
    } else {
      throw new Error('No content received from the API.');
    }

    // Parse the response
    let parsedResponse;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = {
          variations: [{
            name: "Default Variation",
            jsx: text,
            css: baseCode.css || '',
            description: "Generated variation"
          }]
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      parsedResponse = {
        variations: [{
          name: "Default Variation",
          jsx: text,
          css: baseCode.css || '',
          description: "Generated variation"
        }]
      };
    }

    res.json({
      success: true,
      data: parsedResponse
    });

  } catch (error) {
    console.error('AI variations error:', error);
    res.status(500).json({ 
      error: 'Failed to generate variations',
      details: error.message 
    });
  }
});

// Analyze component code
router.post('/analyze', auth, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    const analyzePrompt = `You are an expert React developer and code reviewer. Analyze the following React component code and provide feedback on:

1. Code quality and best practices
2. Performance considerations
3. Accessibility improvements
4. Security considerations
5. Suggested optimizations
6. Potential bugs or issues

Component Code:
${code.jsx || code}

CSS:
${code.css || ''}

Please provide a comprehensive analysis in JSON format:
{
  "analysis": {
    "codeQuality": "Assessment of code quality",
    "performance": "Performance considerations",
    "accessibility": "Accessibility improvements",
    "security": "Security considerations",
    "optimizations": ["List of suggested optimizations"],
    "issues": ["List of potential issues"],
    "overallScore": 85
  }
}`;

    let apiChatHistory = [];
    apiChatHistory.push({ role: "user", parts: [{ text: analyzePrompt }] });

    const payload = { contents: apiChatHistory };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${apiResponse.status}`);
    }

    const result = await apiResponse.json();

    let text = '';
    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
      text = result.candidates[0].content.parts[0].text;
    } else {
      throw new Error('No content received from the API.');
    }

    // Parse the response
    let parsedResponse;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = {
          analysis: {
            codeQuality: "Analysis not available",
            performance: "Analysis not available",
            accessibility: "Analysis not available",
            security: "Analysis not available",
            optimizations: [],
            issues: [],
            overallScore: 0
          }
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      parsedResponse = {
        analysis: {
          codeQuality: "Failed to analyze code",
          performance: "Failed to analyze code",
          accessibility: "Failed to analyze code",
          security: "Failed to analyze code",
          optimizations: [],
          issues: [],
          overallScore: 0
        }
      };
    }

    res.json({
      success: true,
      data: parsedResponse
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze component',
      details: error.message 
    });
  }
});

module.exports = router; 