import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useHostNova } from '../../context/HostNovaContext';
import { BRAND_LOGO_URL } from '../../lib/defaults';

export function AdminLoginPage() {
  const { user, authLoading, isAdmin, signInWithGoogle, signOutUser, navigate } = useHostNova();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      navigate('/admin');
    }
  }, [authLoading, user, isAdmin, navigate]);

  const handleLogin = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060B18] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-[#0B1224] border border-slate-800 rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center bg-white rounded-md px-3 py-1.5 mx-auto">
            <img
              src={BRAND_LOGO_URL}
              alt="HostNova Logo"
              referrerPolicy="no-referrer"
              className="h-9 w-auto object-contain"
            />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-blue-400">
              Restricted Access
            </p>
            <h1 className="text-2xl font-extrabold text-white mt-1">Admin Portal Login</h1>
            <p className="text-xs text-slate-400 mt-1.5">
              Sign in with an authorized administrator Google account. Public admin registration is disabled.
            </p>
          </div>
        </div>

        {authLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : user && !isAdmin ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-rose-950/50 border border-rose-500/40 p-4 flex items-start gap-3 text-xs text-rose-200">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Administrator privileges required</p>
                <p className="mt-1 text-rose-200/80">
                  Signed in as <span className="font-mono">{user.email}</span>, which does not hold an authorized admin role in HostNova.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/account')}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
              >
                Go to Customer Account
              </button>
              <button
                type="button"
                onClick={() => void signOutUser()}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
              >
                Sign Out &amp; Switch Account
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => void handleLogin()}
              disabled={signingIn}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-semibold transition-colors"
            >
              {signingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>Sign in with Google (Admin)</span>
            </button>
            <p className="text-[11px] text-center text-slate-500 leading-relaxed">
              Role verification is enforced server-side by Firestore security rules. Unverified or non-admin accounts cannot query administrative collections.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Website</span>
          </button>
        </div>
      </div>
    </div>
  );
}
