import { Timestamp } from '@firebase/firestore';

export interface Artwork {
  id: string;
  organizationId: string;
  releaseId: string;
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
