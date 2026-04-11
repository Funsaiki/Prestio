import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Public routes (no Firebase, no AuthProvider)
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Legal = lazy(() => import('./pages/Legal').then(m => ({ default: m.Legal })));
const MentionsLegales = lazy(() => import('./pages/MentionsLegales').then(m => ({ default: m.MentionsLegales })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));

// Authenticated app (loads Firebase + AuthContext on demand)
const AuthApp = lazy(() => import('./AuthApp'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Landing />} />
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
