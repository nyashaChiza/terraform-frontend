import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

/**
 * Top-level error boundary. Catches render-time exceptions anywhere in the
 * component tree and renders a friendly fallback with a "Try again" button.
 * Without this, an unhandled render error crashes the whole app to the red
 * screen of death.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production this is where you'd send to Sentry / Bugsnag / etc.
    console.error('Render error caught by ErrorBoundary:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const message = this.state.error?.message ?? 'Unknown error';

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.inner}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app hit an unexpected error. Please try again.
          </Text>
          {__DEV__ && (
            <View style={styles.devBox}>
              <Text style={styles.devLabel}>Dev info:</Text>
              <Text style={styles.devText}>{message}</Text>
            </View>
          )}
          <Pressable onPress={this.handleReset} style={styles.button}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7c3aed',
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#ddd6fe',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  devBox: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    maxWidth: 400,
  },
  devLabel: {
    color: '#c4b5fd',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  devText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 22,
  },
  buttonText: {
    color: '#7c3aed',
    fontWeight: '700',
    fontSize: 15,
  },
});
