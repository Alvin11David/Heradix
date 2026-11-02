const ONBOARDING_SHOWN_KEY = 'amx_signup_onboarding_shown';

export function hasShownSignupOnboarding(): boolean {
  return typeof localStorage !== 'undefined'
    && localStorage.getItem(ONBOARDING_SHOWN_KEY) === 'true';
}

export function markSignupOnboardingShown(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(ONBOARDING_SHOWN_KEY, 'true');
  }
}
