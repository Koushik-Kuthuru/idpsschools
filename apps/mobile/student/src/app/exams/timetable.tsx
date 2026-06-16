import { Redirect } from 'expo-router';

/** Legacy route — class timetable lives at /timetable, separate from exam schedule. */
export default function LegacyClassTimetableRedirect() {
  return <Redirect href="/timetable" />;
}
