import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type NavLinkProps = Omit<PressableProps, 'onPress'> & {
  href: Href;
  style?: StyleProp<ViewStyle>;
};

/** Cross-platform navigation that works reliably on web (Expo Router Link + anchor). */
export function NavLink({ href, children, style, ...props }: NavLinkProps) {
  const flatStyle = StyleSheet.flatten(style) as ViewStyle | undefined;

  return (
    <Link href={href} asChild withAnchor>
      <Pressable style={flatStyle} {...props}>
        {children}
      </Pressable>
    </Link>
  );
}
