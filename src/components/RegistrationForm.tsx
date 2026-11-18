import { useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import type {
  DriverFieldErrors,
  DriverFieldKey,
  DriverFormValues,
  DriverRegistrationResult,
  PhotoAsset,
} from '../types/driver';
import { PhotoUploadCard } from './PhotoUploadCard';

interface RegistrationFormProps {
  onSuccess: (
    result: DriverRegistrationResult,
    photos: { idPhoto: PhotoAsset; motorcyclePhoto: PhotoAsset },
    accessToken: string
  ) => void;
}

const INITIAL_VALUES: DriverFormValues = {
  fullName: '',
  idNumber: '',
  phone: '',
  address: '',
  plateNumber: '',
  idPhoto: null,
  motorcyclePhoto: null,
};

function validateField(key: DriverFieldKey, values: DriverFormValues): string | undefined {
  switch (key) {
    case 'fullName': {
      const trimmed = values.fullName.trim();
      if (!trimmed) return 'Ingresa tu nombre completo.';
      if (trimmed.length < 3) return 'El nombre completo debe tener al menos 3 caracteres.';
      return undefined;
    }
    case 'idNumber': {
      const trimmed = values.idNumber.trim();
      if (!trimmed) return 'Ingresa tu número de carnet de identidad.';
      if (trimmed.length < 4 || !/^[A-Za-z0-9-]+$/.test(trimmed)) {
        return 'Ingresa un número de carnet válido (solo letras, números o guiones).';
      }
      return undefined;
    }
    case 'phone': {
      const trimmed = values.phone.trim();
      if (!trimmed) return 'Ingresa tu número de teléfono.';
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        return 'Ingresa un número de teléfono válido (entre 7 y 15 dígitos).';
      }
      return undefined;
    }
    case 'address': {
      const trimmed = values.address.trim();
      if (!trimmed) return 'Ingresa tu dirección.';
      if (trimmed.length < 5) return 'Ingresa una dirección más detallada.';
      return undefined;
    }
    case 'plateNumber': {
      const trimmed = values.plateNumber.trim().toUpperCase();
      if (!trimmed) return 'Ingresa el número de placa de la motocicleta.';
      if (trimmed.length < 4 || !/^[A-Z0-9-\s]+$/.test(trimmed)) {
        return 'Ingresa un número de placa válido.';
      }
      return undefined;
    }
    case 'idPhoto':
      return values.idPhoto ? undefined : 'Adjunta la fotografía de tu carnet de identidad.';
    case 'motorcyclePhoto':
      return values.motorcyclePhoto ? undefined : 'Adjunta la fotografía de tu motocicleta.';
  }
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [values, setValues] = useState<DriverFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<DriverFieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<DriverFieldKey, boolean>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completedCount = (
    [
      values.fullName.trim().length >= 3,
      values.idNumber.trim().length >= 4,
      values.phone.replace(/\D/g, '').length >= 7,
      values.address.trim().length >= 5,
      values.plateNumber.trim().length >= 4,
      Boolean(values.idPhoto),
      Boolean(values.motorcyclePhoto),
    ] as boolean[]
  ).filter(Boolean).length;

  function updateTextField(
    key: 'fullName' | 'idNumber' | 'phone' | 'address' | 'plateNumber',
    rawValue: string
  ) {
    const nextValue = key === 'plateNumber' ? rawValue.toUpperCase() : rawValue;
    const nextValues = { ...values, [key]: nextValue };
    setValues(nextValues);
    setSubmitError(null);

    if (touched[key] || errors[key]) {
      const msg = validateField(key, nextValues);
      setErrors((prev) => ({ ...prev, [key]: msg }));
    }
  }

  function handleBlur(key: DriverFieldKey) {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const msg = validateField(key, values);
    setErrors((prev) => ({ ...prev, [key]: msg }));
  }

  function updatePhotoField(key: 'idPhoto' | 'motorcyclePhoto', photo: PhotoAsset | null) {
    const nextValues = { ...values, [key]: photo };
    setValues(nextValues);
    setTouched((prev) => ({ ...prev, [key]: true }));
    setSubmitError(null);

    const msg = validateField(key, nextValues);
    setErrors((prev) => ({ ...prev, [key]: msg }));
  }

  function scrollToFirstError(fieldErrors: DriverFieldErrors) {
    const orderedKeys: DriverFieldKey[] = [
      'fullName',
      'idNumber',
      'phone',
      'address',
      'plateNumber',
      'idPhoto',
      'motorcyclePhoto',
    ];
    const firstKey = orderedKeys.find((k) => Boolean(fieldErrors[k]));
    if (!firstKey) return;

    const target = document.getElementById(`field-${firstKey}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (target instanceof HTMLInputElement) {
        target.focus({ preventScroll: true });
      }
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);

    const allKeys: DriverFieldKey[] = [
      'fullName',
      'idNumber',
      'phone',
      'address',
      'plateNumber',
      'idPhoto',
      'motorcyclePhoto',
    ];

    const nextErrors: DriverFieldErrors = {};
    const nextTouched: Partial<Record<DriverFieldKey, boolean>> = {};

    for (const key of allKeys) {
      nextTouched[key] = true;
      const err = validateField(key, values);
      if (err) nextErrors[key] = err;
    }

    setTouched(nextTouched);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !values.idPhoto || !values.motorcyclePhoto) {
      setSubmitError('Completa todos los campos obligatorios antes de enviarnos tu registro.');
      scrollToFirstError(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/drivers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: values.fullName.trim(),
          idNumber: values.idNumber.trim(),
          phone: values.phone.trim(),
          address: values.address.trim(),
          plateNumber: values.plateNumber.trim().toUpperCase(),
          idPhoto: values.idPhoto.dataUrl,
          motorcyclePhoto: values.motorcyclePhoto.dataUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.accessToken) {
        if (data.fieldErrors && typeof data.fieldErrors === 'object') {
          setErrors(data.fieldErrors as DriverFieldErrors);
          scrollToFirstError(data.fieldErrors as DriverFieldErrors);
        }
        setSubmitError(
          data.message || 'No pudimos completar tu registro. Verifica los datos e inténtalo de nuevo.'
        );
        return;
      }

      onSuccess(
        data.registration as DriverRegistrationResult,
        {
          idPhoto: values.idPhoto,
          motorcyclePhoto: values.motorcyclePhoto,
        },
        data.accessToken as string
      );
    } catch {
      setSubmitError(
        'No se pudo conectar con el servidor. Verifica tu conexión a internet e inténtalo nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 lg:py-10">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            REGISTRO DE DRIVERS
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Completa tus datos personales, placa de motocicleta y fotografías para crear tu perfil.
          </p>
        </div>
        <p className="text-xs sm:text-sm font-medium text-slate-600 tabular-nums whitespace-nowrap shrink-0">
          <span className="text-slate-900 font-semibold">{completedCount}</span> de 7 campos listos
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Text Fields (1 to 5) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
              Datos del driver y motocicleta
            </h2>

            {/* 1. Nombre completo */}
            <div>
              <label htmlFor="field-fullName" className="block text-sm font-semibold text-slate-900 mb-1.5">
                Nombre completo <span className="text-orange-700" aria-hidden="true">*</span>
              </label>
              <input
                id="field-fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={values.fullName}
                onChange={(e) => updateTextField('fullName', e.target.value)}
                onBlur={() => handleBlur('fullName')}
                placeholder="Ej. Carlos Mendoza Rojas"
                aria-invalid={Boolean(errors.fullName)}
                className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border text-base text-slate-900 placeholder:text-slate-400 bg-white transition-colors focus:outline-none focus:ring-2 ${
                  errors.fullName
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-slate-300 focus:border-orange-700 focus:ring-orange-100'
                }`}
              />
              {errors.fullName && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs sm:text-sm text-red-700" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errors.fullName}</span>
                </p>
              )}
            </div>

            {/* 2. Número de carnet de identidad */}
            <div>
              <label htmlFor="field-idNumber" className="block text-sm font-semibold text-slate-900 mb-1.5">
                Número de carnet de identidad <span className="text-orange-700" aria-hidden="true">*</span>
              </label>
              <input
                id="field-idNumber"
                name="idNumber"
                type="text"
                inputMode="text"
                required
                value={values.idNumber}
                onChange={(e) => updateTextField('idNumber', e.target.value)}
                onBlur={() => handleBlur('idNumber')}
                placeholder="Ej. 8492015"
                aria-invalid={Boolean(errors.idNumber)}
                className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border text-base font-mono tabular-nums text-slate-900 placeholder:font-sans placeholder:text-slate-400 bg-white transition-colors focus:outline-none focus:ring-2 ${
                  errors.idNumber
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-slate-300 focus:border-orange-700 focus:ring-orange-100'
                }`}
              />
              {errors.idNumber && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs sm:text-sm text-red-700" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errors.idNumber}</span>
                </p>
              )}
            </div>

            {/* 3. Número de teléfono */}
            <div>
              <label htmlFor="field-phone" className="block text-sm font-semibold text-slate-900 mb-1.5">
                Número de teléfono <span className="text-orange-700" aria-hidden="true">*</span>
              </label>
              <input
                id="field-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={values.phone}
                onChange={(e) => updateTextField('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                placeholder="Ej. 71234567"
                aria-invalid={Boolean(errors.phone)}
                className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border text-base font-mono tabular-nums text-slate-900 placeholder:font-sans placeholder:text-slate-400 bg-white transition-colors focus:outline-none focus:ring-2 ${
                  errors.phone
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-slate-300 focus:border-orange-700 focus:ring-orange-100'
                }`}
              />
              {errors.phone && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs sm:text-sm text-red-700" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>

            {/* 4. Dirección */}
            <div>
              <label htmlFor="field-address" className="block text-sm font-semibold text-slate-900 mb-1.5">
                Dirección <span className="text-orange-700" aria-hidden="true">*</span>
              </label>
              <input
                id="field-address"
                name="address"
                type="text"
                autoComplete="street-address"
                required
                value={values.address}
                onChange={(e) => updateTextField('address', e.target.value)}
                onBlur={() => handleBlur('address')}
                placeholder="Ej. Av. América #420, Zona Norte"
                aria-invalid={Boolean(errors.address)}
                className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border text-base text-slate-900 placeholder:text-slate-400 bg-white transition-colors focus:outline-none focus:ring-2 ${
                  errors.address
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-slate-300 focus:border-orange-700 focus:ring-orange-100'
                }`}
              />
              {errors.address && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs sm:text-sm text-red-700" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errors.address}</span>
                </p>
              )}
            </div>

            {/* 5. Número de placa de la motocicleta */}
            <div>
              <label htmlFor="field-plateNumber" className="block text-sm font-semibold text-slate-900 mb-1.5">
                Número de placa de la motocicleta <span className="text-orange-700" aria-hidden="true">*</span>
              </label>
              <input
                id="field-plateNumber"
                name="plateNumber"
                type="text"
                required
                value={values.plateNumber}
                onChange={(e) => updateTextField('plateNumber', e.target.value)}
                onBlur={() => handleBlur('plateNumber')}
                placeholder="Ej. 4821-ABC"
                aria-invalid={Boolean(errors.plateNumber)}
                className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border text-base font-mono uppercase tabular-nums tracking-wider text-slate-900 placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 bg-white transition-colors focus:outline-none focus:ring-2 ${
                  errors.plateNumber
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-slate-300 focus:border-orange-700 focus:ring-orange-100'
                }`}
              />
              {errors.plateNumber && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs sm:text-sm text-red-700" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errors.plateNumber}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Photos (6 & 7) + Submit CTA */}
        <div className="lg:col-span-6 space-y-5">
          {/* 6. Fotografía de su carnet de identidad */}
          <PhotoUploadCard
            id="field-idPhoto"
            label="Fotografía de su carnet de identidad"
            helperText="Toma una foto nítida donde el número y los datos del carnet sean legibles."
            filePrefix="carnet"
            value={values.idPhoto}
            error={errors.idPhoto}
            onChange={(photo) => updatePhotoField('idPhoto', photo)}
          />

          {/* 7. Fotografía de su motocicleta */}
          <PhotoUploadCard
            id="field-motorcyclePhoto"
            label="Fotografía de su motocicleta"
            helperText="Toma una foto clara de la motocicleta completa; procura que la placa sea visible."
            filePrefix="motocicleta"
            value={values.motorcyclePhoto}
            error={errors.motorcyclePhoto}
            onChange={(photo) => updatePhotoField('motorcyclePhoto', photo)}
          />

          {submitError && (
            <div
              className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 flex items-start gap-2.5 text-sm text-red-800"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-700" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Desktop Submit Area */}
          <div className="hidden lg:block pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[54px] px-6 py-3.5 rounded-xl bg-orange-700 hover:bg-orange-800 disabled:opacity-70 active:scale-[0.99] text-white text-base font-semibold inline-flex items-center justify-center gap-2.5 shadow-sm transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                  <span>Enviando registro...</span>
                </>
              ) : (
                <span>REGISTRARME</span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Sticky Thumb-Zone Submit Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-orange-700 hover:bg-orange-800 disabled:opacity-70 active:scale-[0.99] text-white text-base font-semibold inline-flex items-center justify-center gap-2.5 shadow-sm transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                <span>Enviando registro...</span>
              </>
            ) : (
              <span>REGISTRARME</span>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
