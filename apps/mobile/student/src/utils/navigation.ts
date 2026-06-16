import { router, type Href } from 'expo-router';

/** Imperative navigation — keeps tabs anchored when opening stack screens (required on web). */
export function appNavigate(href: Href) {
  router.push(href, { withAnchor: true });
}
