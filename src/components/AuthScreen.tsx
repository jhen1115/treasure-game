import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { signup, login } from '../api';

interface AuthScreenProps {
  onAuth: (token: string, username: string) => void;
  onGuest: () => void;
}

interface FormData {
  username: string;
  password: string;
}

export function AuthScreen({ onAuth, onGuest }: AuthScreenProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const submit = (mode: 'login' | 'signup') => handleSubmit(async ({ username, password }) => {
    setError('');
    setLoading(true);
    try {
      const fn = mode === 'signup' ? signup : login;
      const { token, username: name } = await fn(username, password);
      onAuth(token, name);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  });

  const handleTabChange = () => {
    reset();
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl mb-2 text-amber-900">🏴‍☠️ Treasure Hunt Game 🏴‍☠️</h1>
        <p className="text-amber-700">Sign in to track your scores, or play as a guest!</p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border-2 border-amber-300 rounded-xl shadow-lg p-8 w-full max-w-sm">
        <Tabs defaultValue="signin" onValueChange={handleTabChange}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={submit('login')} className="space-y-4">
              <div>
                <Label htmlFor="signin-username">Username</Label>
                <Input
                  id="signin-username"
                  {...register('username', { required: 'Required' })}
                  className="mt-1"
                  placeholder="treasure_hunter"
                />
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
              </div>
              <div>
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  {...register('password', { required: 'Required' })}
                  className="mt-1"
                  placeholder="••••••"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={submit('signup')} className="space-y-4">
              <div>
                <Label htmlFor="signup-username">Username</Label>
                <Input
                  id="signup-username"
                  {...register('username', {
                    required: 'Required',
                    minLength: { value: 3, message: 'Min 3 characters' },
                  })}
                  className="mt-1"
                  placeholder="treasure_hunter"
                />
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
              </div>
              <div>
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  {...register('password', {
                    required: 'Required',
                    minLength: { value: 6, message: 'Min 6 characters' },
                  })}
                  className="mt-1"
                  placeholder="••••••"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-amber-200" />
          </div>
          <div className="relative flex justify-center text-xs text-amber-500">
            <span className="bg-white px-2">or</span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={onGuest}
          className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          Play as Guest 👤
        </Button>
      </div>
    </div>
  );
}
