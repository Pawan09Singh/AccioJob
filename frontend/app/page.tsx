'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Sparkles, Code, Zap, Users } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="relative z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Component Generator
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setShowRegister(!showRegister)}
              >
                {showRegister ? 'Sign In' : 'Sign Up'}
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Build React Components
              <span className="text-primary-600 block">with AI Magic</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Create beautiful, responsive React components using natural language. 
              Our AI-powered platform generates clean, production-ready code with 
              real-time preview and export capabilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => setShowRegister(true)}>
                Get Started Free
              </Button>
              <Button variant="outline" size="lg">
                View Demo
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  AI-Powered Generation
                </h3>
              </CardHeader>
              <CardBody>
                <p className="text-gray-600 dark:text-gray-300">
                  Describe your component in plain English and watch as our AI 
                  generates clean, modern React code with proper TypeScript support.
                </p>
              </CardBody>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-success-100 dark:bg-success-900 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-success-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Real-Time Preview
                </h3>
              </CardHeader>
              <CardBody>
                <p className="text-gray-600 dark:text-gray-300">
                  See your components come to life instantly with our live preview. 
                  Make adjustments and watch changes happen in real-time.
                </p>
              </CardBody>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-warning-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Collaborative Workflow
                </h3>
              </CardHeader>
              <CardBody>
                <p className="text-gray-600 dark:text-gray-300">
                  Save your work, share with team members, and maintain version 
                  history. Perfect for teams and individual developers alike.
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Auth Forms */}
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                  {showRegister ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-300">
                  {showRegister 
                    ? 'Start building amazing components today' 
                    : 'Sign in to continue your work'
                  }
                </p>
              </CardHeader>
              <CardBody>
                {showRegister ? <RegisterForm /> : <LoginForm />}
                <div className="mt-4 text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setShowRegister(!showRegister)}
                    className="text-sm"
                  >
                    {showRegister 
                      ? 'Already have an account? Sign in' 
                      : "Don't have an account? Sign up"
                    }
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-300">
            <p>&copy; 2024 Component Generator. Built with Next.js and AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 