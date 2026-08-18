import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth';

export default function Auth({ onLogin }: { onLogin: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await authClient.signIn.email({
          email,
          password,
        });
        if (error) {
          alert('Login fehlgeschlagen: ' + error.message);
        } else {
          onLogin();
        }
      } else {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name,
        });
        if (error) {
          alert('Registrierung fehlgeschlagen: ' + error.message);
        } else {
          onLogin();
        }
      }
    } catch (err) {
      console.error(err);
      alert('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>{isLogin ? 'Login' : 'Registrieren'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Melde dich an, um deine Workouts zu sehen.' : 'Erstelle einen Account für IronTrack.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Passwort</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Laden...' : (isLogin ? 'Einloggen' : 'Account erstellen')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Noch keinen Account? Hier registrieren' : 'Bereits einen Account? Hier einloggen'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
