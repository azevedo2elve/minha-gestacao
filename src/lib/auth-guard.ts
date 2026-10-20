import { Profile } from '@/types/database';

export interface RouteGuardParams {
  isAuthenticated: boolean;
  profile: Profile | null;
  segments: string[];
}

/**
 * Determines the target redirect path based on authentication state, RBAC role,
 * and first-access password change requirement.
 * Returns null if the user is allowed on the current route.
 */
export function getRouteRedirect({
  isAuthenticated,
  profile,
  segments,
}: RouteGuardParams): string | null {
  const rootSegment = segments[0] as string | undefined;
  const subSegment = segments[1] as string | undefined;

  const inAuthGroup = rootSegment === '(auth)';
  const inDoulaGroup = rootSegment === '(doula)';
  const inPregnantGroup = rootSegment === '(pregnant)';
  const isLoginPage = inAuthGroup && subSegment === 'login';
  const isChangePasswordPage = inAuthGroup && subSegment === 'change-password';

  // 1. Unauthenticated User
  if (!isAuthenticated || !profile) {
    if (inDoulaGroup || inPregnantGroup || isChangePasswordPage) {
      return '/(auth)/login';
    }
    return null;
  }

  // 2. Authenticated as DOULA
  if (profile.role === 'DOULA') {
    if (!inDoulaGroup) {
      return '/(doula)/dashboard';
    }
    return null;
  }

  // 3. Authenticated as PREGNANT
  if (profile.role === 'PREGNANT') {
    if (profile.must_change_password) {
      // First-access guard: must change password before viewing pregnant app
      if (!isChangePasswordPage) {
        return '/(auth)/change-password';
      }
      return null;
    } else {
      // Active pregnant user: keep within (pregnant) tabs
      if (!inPregnantGroup) {
        return '/(pregnant)/home';
      }
      return null;
    }
  }

  return null;
}

