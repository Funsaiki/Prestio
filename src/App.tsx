import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Legal = lazy(() => import('./pages/Legal').then(m => ({ default: m.Legal })));
const MentionsLegales = lazy(() => import('./pages/MentionsLegales').then(m => ({ default: m.MentionsLegales })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const AuthApp = lazy(() => import('./AuthApp'));

// Check if user might be logged in by looking for Firebase auth persistence in IndexedDB/localStorage
// This avoids loading Firebase just to check auth state
function hasAuthPersistence(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('firebase:authUser:')) return true;
    }
  } catch {
    // localStorage not available
  }
  return false;
}

function SmartHome() {
  if (hasAuthPersistence()) {
    return <AuthApp />;
  }
  return <Landing />;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<SmartHome />} />
          <Route path="/cgu" element={<Legal />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/confidentialite" element={<PrivacyPolicy />} />
          <Route path="*" element={<AuthApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
