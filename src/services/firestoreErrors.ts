import { auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isPermissionError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : typeof error === 'object' && error !== null && 'message' in error ? String((error as any).message) : String(error);
  const code = (error as any)?.code || (error as any)?.name || '';
  const str = String(error).toLowerCase();
  const lowerMsg = msg.toLowerCase();
  const lowerCode = String(code).toLowerCase();
  return (
    lowerCode.includes('permission') ||
    lowerCode.includes('denied') ||
    lowerMsg.includes('permission') ||
    lowerMsg.includes('insufficient') ||
    str.includes('permission') ||
    str.includes('insufficient')
  );
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const currentUser = auth.currentUser;
  const isPerm = isPermissionError(error);
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  if (isPerm) {
    console.warn('[Firestore Permission Notice - Handled Gracefully]', JSON.stringify(errInfo));
    return;
  }
  console.warn('[Firestore Operation Notice]', JSON.stringify(errInfo));
}
