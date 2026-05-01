import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';


const LOGO = require('../assets/images/InTownlogo.png');

type Sheet = 'signin' | 'register' | null;

function FormSheet({
  sheet,
  colors,
  onClose,
}: {
  sheet: Sheet;
  colors: typeof Colors.light;
  onClose: () => void;
}) {
  const { login, register } = useAuth();
  const isRegister = sheet === 'register';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    setError('');
    if (isRegister && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    const result = isRegister
      ? await register(name.trim(), email.trim(), password)
      : await login(email.trim(), password);
    setLoading(false);
    if (result.success) {
      handleClose();
      if (result.isNew && result.role === 'user') {
        router.replace('/tutorial');
      } else {
        router.replace('/(tabs)');
      }
    } else {
      setError(result.error ?? 'Something went wrong. Try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.sheetKav}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.sheetOverlay} />
      </TouchableWithoutFeedback>

      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <Text style={[styles.sheetTitle, { color: colors.text }]}>
          {isRegister ? 'Create account' : 'Sign in'}
        </Text>

        <View style={styles.fields}>
          {isRegister && (
            <View>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Your name"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={(t) => { setName(t); setError(''); }}
                autoCorrect={false}
              />
            </View>
          )}

          <View>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          <View>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder={isRegister ? 'At least 6 characters' : 'Password'}
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              secureTextEntry
            />
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>{isRegister ? 'Create account' : 'Sign in'}</Text>
          )}
        </TouchableOpacity>

        {!isRegister && (
          <View style={[styles.hintBox, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.hintTitle, { color: colors.primary }]}>Demo accounts</Text>
            <Text style={[styles.hintLine, { color: colors.textSecondary }]}>
              User: <Text style={{ color: colors.text }}>user@demo.com · demo123</Text>
            </Text>
            <Text style={[styles.hintLine, { color: colors.textSecondary }]}>
              Organizer: <Text style={{ color: colors.text }}>organizer@demo.com · demo123</Text>
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, authLoading } = useAuth();
  const [sheet, setSheet] = useState<Sheet>(null);

  if (authLoading) return <View style={[styles.safe, { backgroundColor: colors.background }]} />;
  if (user) return <Redirect href="/(tabs)" />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.hero}>
        <Image source={LOGO} style={styles.logo} contentFit="contain" />
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
          Connect with people in your city
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => setSheet('signin')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Sign in</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: colors.primary }]}
          onPress={() => setSheet('register')}
          activeOpacity={0.85}
        >
          <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Create account</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={sheet !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSheet(null)}
      >
        <FormSheet sheet={sheet} colors={colors} onClose={() => setSheet(null)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.xl,
    gap: 12,
  },

  logo: {
    width: 220,
    height: 100,
    marginBottom: 8,
  },

  tagline: {
    fontSize: Theme.fontSize.base,
    textAlign: 'center',
    lineHeight: 22,
  },

  actions: {
    paddingHorizontal: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xl,
    gap: 12,
  },
  primaryBtn: {
    height: 52,
    borderRadius: Theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: Theme.fontSize.base,
    fontWeight: '600',
  },
  secondaryBtn: {
    height: 52,
    borderRadius: Theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontSize: Theme.fontSize.base,
    fontWeight: '600',
  },

  sheetKav: { flex: 1 },
  sheetOverlay: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: 12,
    paddingBottom: 36,
    gap: Theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: '700',
  },

  fields: { gap: Theme.spacing.md },
  label: {
    fontSize: Theme.fontSize.sm,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderRadius: Theme.radius.md,
    borderWidth: 0.5,
    paddingHorizontal: Theme.spacing.md,
    fontSize: Theme.fontSize.base,
  },

  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderWidth: 0.5,
    borderColor: '#FECACA',
  },
  errorText: { color: '#DC2626', fontSize: Theme.fontSize.sm },

  submitBtn: {
    height: 50,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: Theme.fontSize.base, fontWeight: '600' },

  hintBox: {
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    gap: 4,
  },
  hintTitle: {
    fontSize: Theme.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hintLine: { fontSize: Theme.fontSize.xs },
});
