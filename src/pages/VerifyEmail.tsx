import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { doc, setDoc, getDoc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

// Generate a 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function VerifyEmail() {
  const { firebaseUser, userProfile, needsEmailVerification, loading } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if not logged in or already verified
  if (!loading && !firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  if (!loading && userProfile && !needsEmailVerification) {
    return <Navigate to="/onboarding" replace />;
  }

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendCode = async () => {
    if (!firebaseUser?.email) return;

    setSending(true);
    setError('');

    try {
      // Generate code
      const verificationCode = generateVerificationCode();
      const expiresAt = Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000)); // 15 minutes

      // Store in Firestore
      await setDoc(doc(db, 'emailVerifications', firebaseUser.email), {
        code: verificationCode,
        expiresAt,
        attempts: 0,
        createdAt: Timestamp.now(),
      });

      // Send email via EmailJS
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          to_email: firebaseUser.email,
          verification_code: verificationCode,
          app_name: import.meta.env.VITE_APP_NAME || 'Gestion Clients',
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      setCodeSent(true);
      setCountdown(60); // 60 seconds before resend
    } catch (err: unknown) {
      console.error('Error sending code:', err);
      setError('Erreur lors de l\'envoi du code. Veuillez réessayer.');
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Veuillez entrer le code complet');
      return;
    }

    if (!firebaseUser?.email || !firebaseUser?.uid) return;

    setVerifying(true);
    setError('');

    try {
      const docRef = doc(db, 'emailVerifications', firebaseUser.email);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('Aucun code trouvé. Veuillez en demander un nouveau.');
        setVerifying(false);
        return;
      }

      const data = docSnap.data();
      const now = Timestamp.now();

      // Check if expired
      if (data.expiresAt.toMillis() < now.toMillis()) {
        await deleteDoc(docRef);
        setError('Le code a expiré. Veuillez en demander un nouveau.');
        setCodeSent(false);
        setCode(['', '', '', '', '', '']);
        setVerifying(false);
        return;
      }

      // Check attempts (max 5)
      if (data.attempts >= 5) {
        await deleteDoc(docRef);
        setError('Trop de tentatives. Veuillez demander un nouveau code.');
        setCodeSent(false);
        setCode(['', '', '', '', '', '']);
        setVerifying(false);
        return;
      }

      // Verify code
      if (data.code !== fullCode) {
        await updateDoc(docRef, {
          attempts: data.attempts + 1,
        });
        setError(`Code incorrect. ${4 - data.attempts} tentative(s) restante(s).`);
        setVerifying(false);
        return;
      }

      // Code is valid - delete the verification document
      await deleteDoc(docRef);

      // Mark user as verified
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        emailVerified: true,
        emailVerifiedAt: Timestamp.now(),
      });

      // The real-time listener in AuthContext will automatically update the profile
    } catch (err: unknown) {
      console.error('Error verifying code:', err);
      setError('Erreur lors de la vérification. Veuillez réessayer.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (digit && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        setTimeout(() => verifyCode(), 100);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();

      setTimeout(() => verifyCode(), 100);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gold/10 via-white to-gold/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold/10 via-white to-gold/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Vérifiez votre email
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {codeSent
              ? `Un code a été envoyé à ${firebaseUser?.email}`
              : `Nous allons envoyer un code de vérification à ${firebaseUser?.email}`}
          </p>
        </div>

        {!codeSent ? (
          <button
            onClick={sendCode}
            disabled={sending}
            className="w-full py-3 bg-gold text-white rounded-xl hover:bg-gold-dark transition-all duration-200 font-medium disabled:opacity-50 cursor-pointer"
          >
            {sending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                Envoi en cours...
              </span>
            ) : (
              'Envoyer le code'
            )}
          </button>
        ) : (
          <div className="space-y-6">
            {/* Code input */}
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {inputRefs.current[index] = el}}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                />
              ))}
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              onClick={verifyCode}
              disabled={verifying || code.join('').length !== 6}
              className="w-full py-3 bg-gold text-white rounded-xl hover:bg-gold-dark transition-all duration-200 font-medium disabled:opacity-50 cursor-pointer"
            >
              {verifying ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                  Vérification...
                </span>
              ) : (
                'Vérifier'
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Vous n'avez pas reçu le code ?
              </p>
              <button
                onClick={sendCode}
                disabled={sending || countdown > 0}
                className="text-gold hover:text-gold-dark font-medium disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
              >
                {countdown > 0 ? `Renvoyer dans ${countdown}s` : 'Renvoyer le code'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
