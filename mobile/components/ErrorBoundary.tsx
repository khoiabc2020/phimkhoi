import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Restart } from 'expo-restart'; // Or just reload logic

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Oops, Something Went Wrong</Text>
                    <Text style={styles.error}>{this.state.error?.message}</Text>
                    <Pressable style={styles.btn} onPress={() => this.setState({ hasError: false })}>
                        <Text style={styles.btnText}>Try Again</Text>
                    </Pressable>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 },
    title: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    error: { color: 'red', marginBottom: 20, textAlign: 'center' },
    btn: { backgroundColor: '#F4C84A', padding: 10, borderRadius: 5 },
    btnText: { fontWeight: 'bold' }
});
