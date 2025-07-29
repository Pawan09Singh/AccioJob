'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Session } from '@/types';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { 
  Plus, 
  Search, 
  Clock, 
  Tag, 
  Trash2, 
  Edit, 
  Eye,
  Sparkles,
  Code,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    title: '',
    description: '',
    tags: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    loadSessions();
  }, [isAuthenticated, router]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSessions(1, 50, searchQuery);
      setSessions(response.sessions);
    } catch (error: any) {
      toast.error('Failed to load sessions');
      console.error('Load sessions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadSessions();
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSessionData.title.trim()) {
      toast.error('Session title is required');
      return;
    }

    try {
      const tags = newSessionData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const session = await apiClient.createSession({
        title: newSessionData.title,
        description: newSessionData.description,
        tags,
      });

      toast.success('Session created successfully!');
      setShowCreateModal(false);
      setNewSessionData({ title: '', description: '', tags: '' });
      router.push(`/editor/${session._id}`);
    } catch (error: any) {
      toast.error('Failed to create session');
      console.error('Create session error:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      await apiClient.deleteSession(sessionId);
      toast.success('Session deleted successfully');
      loadSessions();
    } catch (error: any) {
      toast.error('Failed to delete session');
      console.error('Delete session error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Sparkles className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Component Generator
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Welcome, {user?.name}
              </span>
              <Button
                variant="outline"
                onClick={() => router.push('/profile')}
              >
                Profile
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Create */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
          </form>
          <Button
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            New Session
          </Button>
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </CardHeader>
                <CardBody>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="text-center py-12">
            <CardBody>
              <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No sessions yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Create your first session to start building components with AI
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Create First Session
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Card key={session._id} className="hover:shadow-medium transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {session.title}
                      </h3>
                      {session.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {session.description}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/editor/${session._id}`)}
                        leftIcon={<Eye className="h-4 w-4" />}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSession(session._id)}
                        leftIcon={<Trash2 className="h-4 w-4" />}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(session.lastAccessed)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="h-4 w-4" />
                      <span>{(session.chatHistory || []).length} messages</span>
                    </div>
                  </div>
                  {(session.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {(session.tags || []).slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {(session.tags || []).length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{(session.tags || []).length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create New Session
              </h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleCreateSession} className="space-y-4">
                <Input
                  label="Session Title"
                  placeholder="Enter session title"
                  value={newSessionData.title}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
                <Input
                  label="Description (Optional)"
                  placeholder="Brief description of your project"
                  value={newSessionData.description}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, description: e.target.value }))}
                />
                <Input
                  label="Tags (Optional)"
                  placeholder="react, ui, button (comma separated)"
                  value={newSessionData.tags}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, tags: e.target.value }))}
                />
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Session
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
} 