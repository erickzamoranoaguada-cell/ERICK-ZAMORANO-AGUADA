export interface PhotoAsset {
  dataUrl: string;
  fileName: string;
  sizeBytes: number;
}

export interface DriverFormValues {
  fullName: string;
  idNumber: string;
  phone: string;
  address: string;
  plateNumber: string;
  idPhoto: PhotoAsset | null;
  motorcyclePhoto: PhotoAsset | null;
}

export type DriverFieldKey = keyof DriverFormValues;

export type DriverFieldErrors = Partial<Record<DriverFieldKey, string>>;

export interface DriverRegistrationResult {
  id: string;
  fullName: string;
  idNumber: string;
  phone: string;
  address: string;
  plateNumber: string;
  createdAt: string;
}

export interface DriverProfileData {
  registration: DriverRegistrationResult;
  photos: {
    idPhotoDataUrl: string;
    motorcyclePhotoDataUrl: string;
  };
}

export interface StoredDriverSession {
  id: string;
  accessToken: string;
}
