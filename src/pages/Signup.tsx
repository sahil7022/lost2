import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, Hash } from 'lucide-react';
import { User } from '../types';

export default function Signup({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [uucms_number, setUucmsNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation for UUCMS format: U15ZR24S0293 (U followed by 11 chars)
    const uucmsRegex = /^U[A-Z0-9]{11}$/;
    if (!uucmsRegex.test(uucms_number)) {
      setError('Invalid UUCMS Number format. Example: U15ZR24S0293');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, uucms_number })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user, data.token);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-card-foreground">Create Account</h1>
          <p className="text-muted-foreground">Join the campus community and help others find their items.</p>
        </div>

        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-2xl text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-secondary border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">UUCMS Number</label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                required
                type="text"
                value={uucms_number}
                onChange={(e) => setUucmsNumber(e.target.value.toUpperCase())}
                className="w-full pl-12 pr-4 py-4 bg-secondary border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="U15ZR24S0293"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-secondary border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="name@university.edu"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-secondary border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>Sign Up <ArrowRight className="ml-2 w-5 h-5" /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-foreground font-bold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
