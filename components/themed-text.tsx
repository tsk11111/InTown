import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Text, type TextProps } from 'react-native';

export function ThemedText({ style, ...otherProps }: TextProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const color = Colors[colorScheme].text;
  return <Text style={[{ color }, style]} {...otherProps} />;
}