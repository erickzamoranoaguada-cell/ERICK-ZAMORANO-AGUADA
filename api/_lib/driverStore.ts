import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'moto-driver-data')
  : path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const REGISTRATIONS_FILE = path.join(DATA_DIR, 'registrations.json');
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export interface RegistrationPayload {
  fullName?: unknown;
  idNumber?: unknown;
  phone?: unknown;
  address?: unknown;
  plateNumber?: unknown;
  idPhoto?: unknown;
  motorcyclePhoto?: unknown;
}

export interface StoredDriverRecord {
  id: string;
  accessTokenHash: string;
  fullName: string;
  idNumber: string;
  phone: string;
  address: string;
  plateNumber: string;
  idPhotoPath: string;
  motorcyclePhotoPath: string;
  createdAt: string;
}

interface ParsedImage {
  extension: string;
  buffer: Buffer;
}

export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function tokensMatch(token: string, expectedHash: string): boolean {
  if (!token || !expectedHash) return false;
  const candidateHash = hashToken(token);
  const a = Buffer.from(candidateHash, 'utf8');
  const b = Buffer.from(expectedHash, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function mimeTypeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

function parseDataUrlImage(value: unknown): ParsedImage | null {
  if (typeof value !== 'string') return null;
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/i.exec(value.trim());
  if (!match) return null;

  const rawType = match[1].toLowerCase();
  const extension = rawType === 'jpeg' ? 'jpg' : rawType;
  const buffer = Buffer.from(match[2], 'base64');

  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
    return null;
  }

  return { extension, buffer };
}

export async function ensureStorageReady(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  try {
    await fs.access(REGISTRATIONS_FILE);
  } catch {
    await fs.writeFile(REGISTRATIONS_FILE, '[]', 'utf8');
  }
}

async function readRegistrations(): Promise<StoredDriverRecord[]> {
  try {
    const raw = await fs.readFile(REGISTRATIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredDriverRecord[]) : [];
  } catch {
    return [];
  }
}

async function saveRegistration(record: StoredDriverRecord): Promise<void> {
  await ensureStorageReady();
  const existing = await readRegistrations();
  existing.push(record);
  const tempFile = `${REGISTRATIONS_FILE}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(existing, null, 2), 'utf8');
  await fs.rename(tempFile, REGISTRATIONS_FILE);
}

export async function getDriverProfile(
  driverIdRaw: unknown,
  driverTokenRaw: unknown
): Promise<ApiResult> {
  try {
    await ensureStorageReady();

    const driverId = typeof driverIdRaw === 'string' ? driverIdRaw.trim() : '';
    const driverToken = typeof driverTokenRaw === 'string' ? driverTokenRaw.trim() : '';

    if (!driverId || !driverToken) {
      return {
        status: 401,
        body: {
          success: false,
          message: 'No se encontró una sesión válida para este conductor.',
        },
      };
    }

    const records = await readRegistrations();
    const record = records.find((item) => item.id === driverId);

    if (!record || !tokensMatch(driverToken, record.accessTokenHash)) {
      return {
        status: 401,
        body: {
          success: false,
          message: 'No autorizado para consultar este perfil.',
        },
      };
    }

    const idPhotoAbs = path.join(UPLOADS_DIR, path.basename(record.idPhotoPath));
    const motoPhotoAbs = path.join(UPLOADS_DIR, path.basename(record.motorcyclePhotoPath));

    const [idBuffer, motoBuffer] = await Promise.all([
      fs.readFile(idPhotoAbs),
      fs.readFile(motoPhotoAbs),
    ]);

    const idPhotoDataUrl = `data:${mimeTypeFromPath(idPhotoAbs)};base64,${idBuffer.toString('base64')}`;
    const motorcyclePhotoDataUrl = `data:${mimeTypeFromPath(motoPhotoAbs)};base64,${motoBuffer.toString('base64')}`;

    return {
      status: 200,
      body: {
        success: true,
        registration: {
          id: record.id,
          fullName: record.fullName,
          idNumber: record.idNumber,
          phone: record.phone,
          address: record.address,
          plateNumber: record.plateNumber,
          createdAt: record.createdAt,
        },
        photos: {
          idPhotoDataUrl,
          motorcyclePhotoDataUrl,
        },
      },
    };
  } catch (error) {
    console.error('Error al obtener perfil del driver:', error);
    return {
      status: 500,
      body: {
        success: false,
        message: 'No se pudo cargar tu perfil en este momento.',
      },
    };
  }
}

export async function registerDriver(payload: unknown): Promise<ApiResult> {
  try {
    await ensureStorageReady();

    const body = (payload ?? {}) as RegistrationPayload;
    const fieldErrors: Record<string, string> = {};

    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const idNumber = typeof body.idNumber === 'string' ? body.idNumber.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const address = typeof body.address === 'string' ? body.address.trim() : '';
    const plateNumber =
      typeof body.plateNumber === 'string' ? body.plateNumber.trim().toUpperCase() : '';

    if (fullName.length < 3) {
      fieldErrors.fullName = 'Ingresa tu nombre completo (mínimo 3 caracteres).';
    }

    if (idNumber.length < 4 || !/^[A-Za-z0-9-]+$/.test(idNumber)) {
      fieldErrors.idNumber = 'Ingresa un número de carnet de identidad válido.';
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      fieldErrors.phone = 'Ingresa un número de teléfono válido (7 a 15 dígitos).';
    }

    if (address.length < 5) {
      fieldErrors.address = 'Ingresa tu dirección completa.';
    }

    if (plateNumber.length < 4 || !/^[A-Z0-9-\s]+$/.test(plateNumber)) {
      fieldErrors.plateNumber = 'Ingresa un número de placa válido.';
    }

    const parsedIdPhoto = parseDataUrlImage(body.idPhoto);
    if (!parsedIdPhoto) {
      fieldErrors.idPhoto = 'Adjunta una fotografía válida de tu carnet de identidad (máx. 10 MB).';
    }

    const parsedMotoPhoto = parseDataUrlImage(body.motorcyclePhoto);
    if (!parsedMotoPhoto) {
      fieldErrors.motorcyclePhoto = 'Adjunta una fotografía válida de tu motocicleta (máx. 10 MB).';
    }

    if (Object.keys(fieldErrors).length > 0 || !parsedIdPhoto || !parsedMotoPhoto) {
      return {
        status: 400,
        body: {
          success: false,
          message: 'Por favor revisa los campos señalados antes de continuar.',
          fieldErrors,
        },
      };
    }

    const shortCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    const registrationId = `DRV-${shortCode}`;
    const accessToken = crypto.randomBytes(24).toString('hex');
    const idPhotoFile = `${registrationId}-carnet.${parsedIdPhoto.extension}`;
    const motoPhotoFile = `${registrationId}-motocicleta.${parsedMotoPhoto.extension}`;

    await Promise.all([
      fs.writeFile(path.join(UPLOADS_DIR, idPhotoFile), parsedIdPhoto.buffer),
      fs.writeFile(path.join(UPLOADS_DIR, motoPhotoFile), parsedMotoPhoto.buffer),
    ]);

    const record: StoredDriverRecord = {
      id: registrationId,
      accessTokenHash: hashToken(accessToken),
      fullName,
      idNumber,
      phone,
      address,
      plateNumber,
      idPhotoPath: idPhotoFile,
      motorcyclePhotoPath: motoPhotoFile,
      createdAt: new Date().toISOString(),
    };

    await saveRegistration(record);

    return {
      status: 201,
      body: {
        success: true,
        message: 'Registro completado correctamente.',
        accessToken,
        registration: {
          id: record.id,
          fullName: record.fullName,
          idNumber: record.idNumber,
          phone: record.phone,
          address: record.address,
          plateNumber: record.plateNumber,
          createdAt: record.createdAt,
        },
      },
    };
  } catch (error) {
    console.error('Error al registrar driver:', error);
    return {
      status: 500,
      body: {
        success: false,
        message: 'Ocurrió un problema al guardar tu registro. Inténtalo nuevamente.',
      },
    };
  }
}
