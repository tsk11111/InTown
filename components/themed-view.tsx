import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { View, type ViewProps } from 'react-native';

export function ThemedView({ style, ...otherProps }: ViewProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = Colors[colorScheme].background;
  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}