const express = require('express');
const Session = require('../models/Session');
const { auth } = require('../middleware/auth');
const { setSessionData, getSessionData } = require('../config/redis');

const router = express.Router();

// Helper function to ensure session data has proper defaults
const ensureSessionDefaults = (session) => {
  return {
    ...session.toObject(),
    chatHistory: session.chatHistory || [],
    tags: session.tags || [],
    componentCode: session.componentCode || {
      jsx: '',
      css: '',
      tsx: '',
      version: 1,
      lastModified: new Date()
    },
    uiState: session.uiState || {
      selectedElement: null,
      properties: {},
      viewport: { width: 1200, height: 800 },
      theme: 'light'
    }
  };
};

// Get all sessions for current user
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    let query = { userId: req.user._id, isActive: true };

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sessions = await Session.find(query)
      .sort({ lastAccessed: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-chatHistory -componentCode -uiState');

    const total = await Session.countDocuments(query);

    // Ensure all sessions have proper defaults
    const sessionsWithDefaults = sessions.map(session => ensureSessionDefaults(session));

    res.json({
      sessions: sessionsWithDefaults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get single session with full data
router.get('/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user._id,
      isActive: true
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Cache session data in Redis for faster access
    await setSessionData(sessionId, {
      chatHistory: session.chatHistory || [],
      componentCode: session.componentCode || {},
      uiState: session.uiState || {}
    });

    res.json({ session: ensureSessionDefaults(session) });
  } catch (error) {
    console.error('Fetch session error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Create new session
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, tags } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const session = new Session({
      userId: req.user._id,
      title,
      description: description || '',
      tags: tags || [],
      chatHistory: [],
      componentCode: {
        jsx: '',
        css: '',
        tsx: '',
        version: 1,
        lastModified: new Date()
      },
      uiState: {
        selectedElement: null,
        properties: {},
        viewport: {
          width: 1200,
          height: 800
        },
        theme: 'light'
      }
    });

    await session.save();

    res.status(201).json({
      message: 'Session created successfully',
      session: ensureSessionDefaults(session)
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Update session metadata
router.put('/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title, description, tags } = req.body;

    const session = await Session.findOneAndUpdate(
      {
        _id: sessionId,
        userId: req.user._id,
        isActive: true
      },
      {
        title,
        description,
        tags,
        lastAccessed: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      message: 'Session updated successfully',
      session
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete session (soft delete)
router.delete('/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOneAndUpdate(
      {
        _id: sessionId,
        userId: req.user._id,
        isActive: true
      },
      { isActive: false },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Clear session data from Redis
    await setSessionData(sessionId, null);

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Add chat message to session
router.post('/:sessionId/chat', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { role, content, metadata } = req.body;

    if (!role || !content) {
      return res.status(400).json({ error: 'Role and content are required' });
    }

    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user._id,
      isActive: true
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await session.addChatMessage(role, content, metadata);

    // Update Redis cache
    await setSessionData(sessionId, {
      chatHistory: session.chatHistory,
      componentCode: session.componentCode,
      uiState: session.uiState
    });

    res.json({
      message: 'Chat message added successfully',
      messageCount: session.chatHistory.length
    });
  } catch (error) {
    console.error('Add chat message error:', error);
    res.status(500).json({ error: 'Failed to add chat message' });
  }
});

// Update component code
router.put('/:sessionId/code', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { jsx, css, tsx } = req.body;

    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user._id,
      isActive: true
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await session.updateComponentCode(jsx, css, tsx);

    // Update Redis cache
    await setSessionData(sessionId, {
      chatHistory: session.chatHistory,
      componentCode: session.componentCode,
      uiState: session.uiState
    });

    res.json({
      message: 'Component code updated successfully',
      componentCode: session.componentCode
    });
  } catch (error) {
    console.error('Update component code error:', error);
    res.status(500).json({ error: 'Failed to update component code' });
  }
});

// Update UI state
router.put('/:sessionId/ui-state', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const uiState = req.body;

    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user._id,
      isActive: true
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await session.updateUIState(uiState);

    // Update Redis cache
    await setSessionData(sessionId, {
      chatHistory: session.chatHistory,
      componentCode: session.componentCode,
      uiState: session.uiState
    });

    res.json({
      message: 'UI state updated successfully',
      uiState: session.uiState
    });
  } catch (error) {
    console.error('Update UI state error:', error);
    res.status(500).json({ error: 'Failed to update UI state' });
  }
});

// Get session statistics
router.get('/:sessionId/stats', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user._id,
      isActive: true
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const stats = {
      messageCount: session.chatHistory.length,
      codeVersion: session.componentCode.version,
      lastModified: session.componentCode.lastModified,
      createdAt: session.createdAt,
      lastAccessed: session.lastAccessed,
      userMessages: session.chatHistory.filter(msg => msg.role === 'user').length,
      assistantMessages: session.chatHistory.filter(msg => msg.role === 'assistant').length
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get session stats error:', error);
    res.status(500).json({ error: 'Failed to get session statistics' });
  }
});

module.exports = router; 