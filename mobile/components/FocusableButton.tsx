import React, { useState, forwardRef } from 'react';
import { Pressable, PressableProps, Animated, ViewStyle, StyleProp } from 'react-native';

interface FocusableButtonProps extends PressableProps {
    style?: StyleProp<ViewStyle>;
    focusStyle?: StyleProp<ViewStyle>;
    onFocus?: () => void;
    onBlur?: () => void;
    scaleOnFocus?: boolean;
}

const FocusableButton = forwardRef<any, FocusableButtonProps>(({
    style,
    focusStyle,
    onFocus,
    onBlur,
    children,
    scaleOnFocus = true,
    ...props
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handleFocus = () => {
        setIsFocused(true);
        if (scaleOnFocus) {
            Animated.spring(scaleAnim, {
                toValue: 1.05,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }).start();
        }
        if (onFocus) onFocus();
    };

    const handleBlur = () => {
        setIsFocused(false);
        if (scaleOnFocus) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }).start();
        }
        if (onBlur) onBlur();
    };

    return (
        <Pressable
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={({ focused, pressed }) => [
                style,
                focused && focusStyle,
                pressed && { opacity: 0.8 } // Hint when physically clicking OK
            ]}
            {...props}
        >
            <Animated.View style={scaleOnFocus ? { transform: [{ scale: scaleAnim }] } : {}}>
                {children}
            </Animated.View>
        </Pressable>
    );
});

FocusableButton.displayName = 'FocusableButton';

export default FocusableButton;
