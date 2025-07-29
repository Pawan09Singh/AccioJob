'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Session, ChatMessage, ComponentCode } from '@/types';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { 
  Send, 
  Code, 
  Eye, 
  Download, 
  Copy,
  ArrowLeft,
  Save,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditorPage() {
  const { sessionId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'jsx' | 'css' | 'tsx'>('preview');
  const [componentCode, setComponentCode] = useState<ComponentCode>({
    jsx: '',
    css: '',
    tsx: '',
    version: 1,
    lastModified: new Date().toISOString()
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    loadSession();
  }, [isAuthenticated, sessionId, router]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const sessionData = await apiClient.getSession(sessionId as string);
      setSession(sessionData);
      setComponentCode(sessionData.componentCode);
    } catch (error: any) {
      toast.error('Failed to load session');
      console.error('Load session error:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    try {
      setGenerating(true);
      
      // Add user message to chat
      const userMessage: Omit<ChatMessage, '_id' | 'timestamp'> = {
        role: 'user',
        content: prompt,
      };
      
      await apiClient.addChatMessage(sessionId as string, userMessage);

      // Generate component
      const response = await apiClient.generateComponent({
        prompt,
        sessionId: sessionId as string,
        existingCode: componentCode,
        chatHistory: session?.chatHistory || []
      });

      console.log('Generated component response:', response);

      // Update component code
      const newCode = {
        ...componentCode,
        jsx: response.jsx || '',
        css: response.css || '',
        tsx: response.tsx || '',
        version: componentCode.version + 1,
        lastModified: new Date().toISOString()
      };

      console.log('Updated component code:', newCode);
      setComponentCode(newCode);
      await apiClient.updateComponentCode(sessionId as string, newCode);

      // Add AI response to chat
      const aiMessage: Omit<ChatMessage, '_id' | 'timestamp'> = {
        role: 'assistant',
        content: response.explanation,
      };
      
      await apiClient.addChatMessage(sessionId as string, aiMessage);

      // Reload session to get updated chat history
      await loadSession();
      
      setPrompt('');
      toast.success('Component generated successfully!');
    } catch (error: any) {
      toast.error('Failed to generate component');
      console.error('Generate error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = async (type: 'jsx' | 'css' | 'tsx') => {
    const code = componentCode[type];
    if (!code) {
      toast.error('No code to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      toast.success(`${type.toUpperCase()} code copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const handleDownload = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add JSX file
      if (componentCode.jsx) {
        zip.file('Component.jsx', componentCode.jsx);
      }

      // Add CSS file
      if (componentCode.css) {
        zip.file('styles.css', componentCode.css);
      }

      // Add TSX file
      if (componentCode.tsx) {
        zip.file('Component.tsx', componentCode.tsx);
      }

      // Add README
      const readme = `# Generated Component

This component was generated using AI.

## Files:
- Component.jsx: React component
- styles.css: Component styles
- Component.tsx: TypeScript version (if available)

## Usage:
Import the component and styles into your React project.
`;

      zip.file('README.md', readme);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `component-${session?.title || 'generated'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Component downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download component');
      console.error('Download error:', error);
    }
  };

  const renderPreview = () => {
    if (!componentCode.jsx) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <Code className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No component to preview</p>
            <p className="text-sm">Generate a component using the chat below</p>
          </div>
        </div>
      );
    }

    // Clean and prepare the JSX code
    let jsxCode = componentCode.jsx.trim();
    
    // Remove any import statements and export statements
    jsxCode = jsxCode.replace(/import\s+.*?from\s+['"][^'"]*['"];?\s*/g, '');
    jsxCode = jsxCode.replace(/export\s+(default\s+)?/g, '');
    
    // Extract component name
    const componentMatch = jsxCode.match(/(?:function|const)\s+(\w+)/);
    const componentName = componentMatch ? componentMatch[1] : 'App';
    
    // Ensure the component is properly defined
    if (!jsxCode.includes('return')) {
      jsxCode = `function ${componentName}() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Generated Component</h1>
      <p>This is a placeholder component. Please check the generated code.</p>
    </div>
  );
}`;
    }

    // Add error boundary
    const errorBoundary = `
      class ErrorBoundary extends React.Component {
        constructor(props) {
          super(props);
          this.state = { hasError: false, error: null };
        }
        
        static getDerivedStateFromError(error) {
          return { hasError: true, error };
        }
        
        componentDidCatch(error, errorInfo) {
          console.error('Component Error:', error, errorInfo);
        }
        
        render() {
          if (this.state.hasError) {
            return (
              <div style={{ padding: '20px', color: 'red', border: '1px solid red', borderRadius: '4px' }}>
                <h3>Component Error</h3>
                <p>{this.state.error?.message || 'Something went wrong'}</p>
                <button onClick={() => this.setState({ hasError: false })}>Try Again</button>
              </div>
            );
          }
          return this.props.children;
        }
      }
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Component Preview</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              background: #f5f5f5;
            }
            #root { 
              background: white; 
              border-radius: 8px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            ${componentCode.css}
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <script type="text/babel" data-type="module">
            const { useState, useEffect } = React;
            
            ${errorBoundary}
            
            ${jsxCode}
            
            // Render the component with error boundary
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(
              React.createElement(ErrorBoundary, null,
                React.createElement(${componentName})
              )
            );
          </script>
        </body>
      </html>
    `;

    return (
      <div className="relative w-full h-full">
        <iframe
          srcDoc={htmlContent}
          className="w-full h-full border-0 rounded-lg"
          title="Component Preview"
          sandbox="allow-scripts allow-same-origin"
          onError={(e) => {
            console.error('Preview iframe error:', e);
          }}
        />
        <div className="absolute top-2 right-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const iframe = document.querySelector('iframe');
              if (iframe) {
                iframe.src = iframe.src;
              }
            }}
          >
            Refresh Preview
          </Button>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-dots">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {session?.title}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {session?.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Chat Panel */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Assistant
                </h2>
              </CardHeader>
              <CardBody className="flex-1 flex flex-col">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {session?.chatHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 ml-8'
                          : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 mr-8'
                      }`}
                    >
                      <p className="text-sm text-gray-900 dark:text-white">
                        {message.content}
                      </p>
                    </div>
                  ))}
                  {generating && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mr-8">
                      <div className="flex items-center space-x-2">
                        <div className="loading-dots">
                          <div></div>
                          <div></div>
                          <div></div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Generating component...
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Describe the component you want to create..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handleGenerate();
                      }
                    }}
                  />
                  <Button
                    onClick={handleGenerate}
                    loading={generating}
                    disabled={generating || !prompt.trim()}
                    className="w-full"
                    leftIcon={<Sparkles className="h-4 w-4" />}
                  >
                    Generate Component
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Preview/Code Panel */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-1">
                    <Button
                      variant={activeTab === 'preview' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('preview')}
                      leftIcon={<Eye className="h-4 w-4" />}
                    >
                      Preview
                    </Button>
                    <Button
                      variant={activeTab === 'jsx' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('jsx')}
                      leftIcon={<Code className="h-4 w-4" />}
                    >
                      JSX
                    </Button>
                    <Button
                      variant={activeTab === 'css' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('css')}
                      leftIcon={<Code className="h-4 w-4" />}
                    >
                      CSS
                    </Button>
                    <Button
                      variant={activeTab === 'tsx' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('tsx')}
                      leftIcon={<Code className="h-4 w-4" />}
                    >
                      TSX
                    </Button>
                  </div>
                  {activeTab !== 'preview' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyCode(activeTab as 'jsx' | 'css' | 'tsx')}
                      leftIcon={<Copy className="h-4 w-4" />}
                    >
                      Copy
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardBody className="flex-1 p-0">
                {activeTab === 'preview' ? (
                  <div className="h-full bg-white dark:bg-gray-900">
                    {renderPreview()}
                  </div>
                ) : (
                  <div className="h-full">
                    <textarea
                      className="w-full h-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-0 resize-none focus:outline-none"
                      value={componentCode[activeTab] || ''}
                      readOnly
                      placeholder={`No ${activeTab.toUpperCase()} code available`}
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 