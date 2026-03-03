import { Redirect } from 'expo-router';

// Register is now integrated into the unified login screen
export default function RegisterScreen() {
    return <Redirect href="/(auth)/login" />;
}
