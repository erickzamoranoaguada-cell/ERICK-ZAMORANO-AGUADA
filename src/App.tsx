import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DriverHomeScreen } from './components/DriverHomeScreen';
import { DriverProfileScreen } from './components/DriverProfileScreen';
import { RegistrationForm } from './components/RegistrationForm';
import type {
  DriverProfileData,
  DriverRegistrationResult,
  PhotoAsset,
  StoredDriverSession,
} from './types/driver';

const SESSION_STORAGE_KEY = 'moto_driver_session_v1';
const PROFILE_CACHE_STORAGE_KEY = 'moto_driver_profile_v1';

type AppState = 'loading' | 'unregistered' | 'registered' | 'error';
type RegisteredView = 'profile' | 'home';

function readStoredSession(): StoredDriverSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDriverSession>;
    if (typeof parsed.id === 'string' && typeof parsed.accessToken === 'string' && parsed.id && parsed.accessToken) {
      return { id: parsed.id, accessToken: parsed.accessToken };
    }
    return null;
  } catch {
    return null;
  }
}

function readCachedProfile(expectedDriverId: string): DriverProfileData | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DriverProfileData>;
    if (
      parsed.registration?.id === expectedDriverId &&
      typeof parsed.photos?.idPhotoDataUrl === 'string' &&
      typeof parsed.photos?.motorcyclePhotoDataUrl === 'string'
    ) {
      return parsed as DriverProfileData;
    }
    return null;
  } catch {
    return null;
  }
}

function saveCachedProfile(profileData: DriverProfileData): void {
  try {
    localStorage.setItem(PROFILE_CACHE_STORAGE_KEY, JSON.stringify(profileData));
  } catch {
    // Ignore storage quota issues; session token remains stored
  }
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [registeredView, setRegisteredView] = useState<RegisteredView>('profile');
  const [profile, setProfile] = useState<DriverProfileData | null>(null);
  const [justRegistered, setJustRegistered] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDriverProfile = useCallback(async () => {
    const session = readStoredSession();
    if (!session) {
      setProfile(null);
      setJustRegistered(false);
      setAppState('unregistered');
      return;
    }

    setAppState('loading');
    setLoadError(null);

    try {
      const response = await fetch('/api/drivers/me', {
        method: 'GET',
        headers: {
          'x-driver-id': session.id,
          'x-driver-token': session.accessToken,
        },
      });

      if (response.status === 401 || response.status === 404) {
        const cached = readCachedProfile(session.id);
        if (cached) {
          setProfile(cached);
          setJustRegistered(false);
          setRegisteredView('profile');
          setAppState('registered');
          return;
        }
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(PROFILE_CACHE_STORAGE_KEY);
        setProfile(null);
        setJustRegistered(false);
        setAppState('unregistered');
        return;
      }

      const data = await response.json();
      if (!response.ok || !data.success || !data.registration || !data.photos) {
        throw new Error(data.message || 'No se pudo cargar tu perfil.');
      }

      const loadedProfile: DriverProfileData = {
        registration: data.registration as DriverRegistrationResult,
        photos: data.photos as DriverProfileData['photos'],
      };
      saveCachedProfile(loadedProfile);
      setProfile(loadedProfile);
      setJustRegistered(false);
      setRegisteredView('profile');
      setAppState('registered');
    } catch {
      const cached = readCachedProfile(session.id);
      if (cached) {
        setProfile(cached);
        setJustRegistered(false);
        setRegisteredView('profile');
        setAppState('registered');
        return;
      }
      setLoadError('No pudimos conectar con el servidor para cargar tu perfil. Verifica tu conexión.');
      setAppState('error');
    }
  }, []);

  useEffect(() => {
    loadDriverProfile();
  }, [loadDriverProfile]);

  function handleRegistrationSuccess(
    result: DriverRegistrationResult,
    photos: { idPhoto: PhotoAsset; motorcyclePhoto: PhotoAsset },
    accessToken: string
  ) {
    const session: StoredDriverSession = { id: result.id, accessToken };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

    const newProfile: DriverProfileData = {
      registration: result,
      photos: {
        idPhotoDataUrl: photos.idPhoto.dataUrl,
        motorcyclePhotoDataUrl: photos.motorcyclePhoto.dataUrl,
      },
    };
    saveCachedProfile(newProfile);
    setProfile(newProfile);
    setJustRegistered(true);
    setRegisteredView('profile');
    setAppState('registered');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleGoHome() {
    if (appState !== 'registered') return;
    setJustRegistered(false);
    setRegisteredView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleOpenProfile() {
    if (appState !== 'registered') return;
    setRegisteredView('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const headerTitle =
    appState === 'registered'
      ? registeredView === 'profile'
        ? 'MI PERFIL DE DRIVER'
        : 'REGISTRO DE DRIVERS'
      : 'REGISTRO DE DRIVERS';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <span className="font-display text-base sm:text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            {headerTitle}
          </span>
        </div>
      </header>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {appState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-4 text-slate-600"
            >
              <Loader2 className="w-7 h-7 animate-spin text-orange-700" />
              <p className="text-sm font-medium">Cargando tu información...</p>
            </motion.div>
          )}

          {appState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-md mx-auto px-4 py-16 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{loadError}</p>
              <button
                type="button"
                onClick={loadDriverProfile}
                className="min-h-[48px] px-5 py-2.5 rounded-xl bg-orange-700 hover:bg-orange-800 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4 shrink-0" />
                <span>Reintentar</span>
              </button>
            </motion.div>
          )}

          {appState === 'unregistered' && (
            <motion.div
              key="unregistered"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <RegistrationForm onSuccess={handleRegistrationSuccess} />
            </motion.div>
          )}

          {appState === 'registered' && profile && registeredView === 'profile' && (
            <motion.div
              key="registered-profile"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <DriverProfileScreen
                profile={profile}
                justRegistered={justRegistered}
                onGoHome={handleGoHome}
              />
            </motion.div>
          )}

          {appState === 'registered' && profile && registeredView === 'home' && (
            <motion.div
              key="registered-home"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <DriverHomeScreen profile={profile} onOpenProfile={handleOpenProfile} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
