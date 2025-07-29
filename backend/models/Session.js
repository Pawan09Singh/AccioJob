const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const componentCodeSchema = new mongoose.Schema({
  jsx: {
    type: String,
    default: ''
  },
  css: {
    type: String,
    default: ''
  },
  tsx: {
    type: String,
    default: ''
  },
  version: {
    type: Number,
    default: 1
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
});

const uiStateSchema = new mongoose.Schema({
  selectedElement: {
    type: String,
    default: null
  },
  properties: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  viewport: {
    width: {
      type: Number,
      default: 1200
    },
    height: {
      type: Number,
      default: 800
    }
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  }
});

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  chatHistory: {
    type: [chatMessageSchema],
    default: []
  },
  componentCode: {
    type: componentCodeSchema,
    default: () => ({})
  },
  uiState: {
    type: uiStateSchema,
    default: () => ({})
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  tags: {
    type: [{
      type: String,
      trim: true
    }],
    default: []
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Update lastAccessed on save
sessionSchema.pre('save', function(next) {
  this.lastAccessed = new Date();
  next();
});

// Indexes for better query performance
sessionSchema.index({ userId: 1, lastAccessed: -1 });
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ title: 'text', description: 'text' });

// Virtual for chat message count
sessionSchema.virtual('messageCount').get(function() {
  return this.chatHistory.length;
});

// Method to add chat message
sessionSchema.methods.addChatMessage = function(role, content, metadata = {}) {
  this.chatHistory.push({
    role,
    content,
    metadata
  });
  return this.save();
};

// Method to update component code
sessionSchema.methods.updateComponentCode = function(jsx, css, tsx = '') {
  this.componentCode.jsx = jsx;
  this.componentCode.css = css;
  this.componentCode.tsx = tsx;
  this.componentCode.version += 1;
  this.componentCode.lastModified = new Date();
  return this.save();
};

// Method to update UI state
sessionSchema.methods.updateUIState = function(uiState) {
  this.uiState = { ...this.uiState, ...uiState };
  return this.save();
};

module.exports = mongoose.model('Session', sessionSchema); 