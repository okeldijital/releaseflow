import { Timestamp } from '@firebase/firestore';

export interface Artwork {
  id: string;
  organizationId: string;
  releaseId: string;
  publicId: string;
  secureUrl: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
