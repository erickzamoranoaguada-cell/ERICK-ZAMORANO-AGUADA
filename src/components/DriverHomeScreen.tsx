import { useState } from 'react';
import { ArrowRight, Bike, CheckCircle2, User } from 'lucide-react';
import type { DriverProfileData } from '../types/driver';

interface DriverHomeScreenProps {
  profile: DriverProfileData;
  onOpenProfile: () => void;
}

const WELCOME_IMAGE_URL = '/src/assets/images/motorcycle_driver_welcome_1794942937916.jpg';

export function DriverHomeScreen({ profile, onOpenProfile }: DriverHomeScreenProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const { registration } = profile;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        <div className="lg:col-span-6 lg:order-2">
          <div className="relative h-full min-h-[220px] sm:min-h-[300px] lg:min-h-[440px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-200">
            {imageFailed ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-800 to-slate-900 text-white p-8 text-center">
                <Bike className="w-12 h-12 text-orange-400" />
                <p className="font-display text-lg font-bold">REGISTRO DE DRIVERS</p>
              </div>
            ) : (
              <img
                src={WELCOME_IMAGE_URL}
                alt="Conductor de motocicleta registrado"
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
                className="w-full h-full object-cover object-center lg:absolute lg:inset-0"
              />
            )}
          </div>
        </div>

        <div className="lg:col-span-6 lg:order-1 flex flex-col justify-center space-y-6 sm:space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Registro completado · Folio <span className="font-mono tabular-nums">{registration.id}</span></span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
              Hola, {registration.fullName}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Tu perfil de conductor ya se encuentra registrado en este dispositivo. Puedes
              consultar tus datos personales y fotografías registradas en cualquier momento.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
            <div className="px-4 py-3.5 flex items-center justify-between gap-4 text-sm">
              <span className="inline-flex items-center gap-2 text-slate-600">
                <User className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Conductor</span>
              </span>
              <span className="font-semibold text-slate-900 text-right truncate">
                {registration.fullName}
              </span>
            </div>
            <div className="px-4 py-3.5 flex items-center justify-between gap-4 text-sm">
              <span className="inline-flex items-center gap-2 text-slate-600">
                <Bike className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Placa de motocicleta</span>
              </span>
              <span className="font-mono tabular-nums uppercase font-semibold text-slate-900">
                {registration.plateNumber}
              </span>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenProfile}
              className="w-full sm:w-auto min-h-[52px] px-7 py-3.5 rounded-xl bg-orange-700 hover:bg-orange-800 active:scale-[0.99] text-white text-base font-semibold inline-flex items-center justify-center gap-2.5 shadow-sm transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
            >
              <span>VER MI PERFIL</span>
              <ArrowRight className="w-5 h-5 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
