import { useState } from 'react';
import { Bike, CheckCircle2, CreditCard, Eye, Home, MapPin, Phone, User, X } from 'lucide-react';
import type { DriverProfileData } from '../types/driver';

interface DriverProfileScreenProps {
  profile: DriverProfileData;
  justRegistered: boolean;
  onGoHome: () => void;
}

interface LightboxState {
  title: string;
  src: string;
}

export function DriverProfileScreen({
  profile,
  justRegistered,
  onGoHome,
}: DriverProfileScreenProps) {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const { registration, photos } = profile;

  const formattedDate = new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(registration.createdAt));

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {justRegistered && (
        <div
          className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 sm:px-5 py-4 flex items-start gap-3"
          role="status"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-sm sm:text-base font-semibold text-emerald-950">
              ¡Registro completado correctamente!
            </p>
            <p className="text-xs sm:text-sm text-emerald-800">
              Tu perfil personal de driver ha quedado guardado en este dispositivo.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs sm:text-sm font-medium text-slate-600">
            Perfil del conductor · Folio{' '}
            <span className="font-mono tabular-nums text-slate-900">{registration.id}</span>
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            {registration.fullName}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 tabular-nums whitespace-nowrap shrink-0">
          Registrado el {formattedDate}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Personal & Motorcycle Data */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 pb-3.5 border-b border-slate-100">
              Datos personales y motocicleta
            </h2>

            <dl className="divide-y divide-slate-100 text-sm">
              <div className="py-3.5 flex items-start gap-3">
                <User className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-slate-500">Nombre completo</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5 break-words">
                    {registration.fullName}
                  </dd>
                </div>
              </div>

              <div className="py-3.5 flex items-start gap-3">
                <CreditCard className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-slate-500">Número de carnet de identidad</dt>
                  <dd className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                    {registration.idNumber}
                  </dd>
                </div>
              </div>

              <div className="py-3.5 flex items-start gap-3">
                <Phone className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-slate-500">Número de teléfono</dt>
                  <dd className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                    {registration.phone}
                  </dd>
                </div>
              </div>

              <div className="py-3.5 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-slate-500">Dirección</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5 break-words">
                    {registration.address}
                  </dd>
                </div>
              </div>

              <div className="pt-3.5 flex items-start gap-3">
                <Bike className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-slate-500">Número de placa de la motocicleta</dt>
                  <dd className="font-mono tabular-nums uppercase tracking-wider font-semibold text-slate-900 mt-0.5">
                    {registration.plateNumber}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>

        {/* Registered Photographs */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col justify-between space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Fotografía del carnet de identidad
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Documento registrado</p>
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <img
                src={photos.idPhotoDataUrl}
                alt="Fotografía del carnet de identidad del driver"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setLightbox({
                    title: 'Fotografía del carnet de identidad',
                    src: photos.idPhotoDataUrl,
                  })
                }
                className="absolute bottom-2.5 right-2.5 min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-medium inline-flex items-center gap-1.5 backdrop-blur-xs transition-colors whitespace-nowrap"
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span>Ampliar</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col justify-between space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Fotografía de la motocicleta
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Placa <span className="font-mono tabular-nums">{registration.plateNumber}</span>
              </p>
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <img
                src={photos.motorcyclePhotoDataUrl}
                alt="Fotografía de la motocicleta del driver"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setLightbox({
                    title: 'Fotografía de la motocicleta',
                    src: photos.motorcyclePhotoDataUrl,
                  })
                }
                className="absolute bottom-2.5 right-2.5 min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-medium inline-flex items-center gap-1.5 backdrop-blur-xs transition-colors whitespace-nowrap"
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span>Ampliar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 flex justify-start">
        <button
          type="button"
          onClick={onGoHome}
          className="w-full sm:w-auto min-h-[50px] px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-sm sm:text-base font-semibold inline-flex items-center justify-center gap-2.5 shadow-sm transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
        >
          <Home className="w-4 h-4 shrink-0" />
          <span>VOLVER AL INICIO</span>
        </button>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-200">
              <p className="text-sm font-semibold text-slate-900 truncate">{lightbox.title}</p>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Cerrar vista ampliada"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-950 flex items-center justify-center max-h-[75vh]">
              <img
                src={lightbox.src}
                alt={lightbox.title}
                referrerPolicy="no-referrer"
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
