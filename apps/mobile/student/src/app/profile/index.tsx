import { Redirect } from 'expo-router';

/** Legacy `/profile` route — main profile lives on the tab. */
export default function ProfileRedirect() {
  return <Redirect href="/(tabs)/profile" />;
}
