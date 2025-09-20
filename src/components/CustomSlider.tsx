import React, { useState, useRef } from 'react';
import { View, StyleSheet, PanResponder, Dimensions, ViewStyle } from 'react-native';

interface CustomSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  style?: ViewStyle;
  isFrozen?: boolean;
}

export const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  minimumValue,
  maximumValue,
  onValueChange,
  disabled = false,
  style,
  isFrozen = false
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderRef = useRef<View>(null);

  const getValueFromGesture = (gestureX: number): number => {
    const ratio = Math.max(0, Math.min(1, gestureX / sliderWidth));
    const rawValue = minimumValue + ratio * (maximumValue - minimumValue);
    // Round to nearest 5
    const roundedValue = Math.round(rawValue / 5) * 5;
    // Ensure within bounds
    return Math.max(minimumValue, Math.min(maximumValue, roundedValue));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (evt) => {
        const locationX = evt.nativeEvent.locationX;
        const newValue = getValueFromGesture(locationX);
        onValueChange(newValue);
      },
      onPanResponderMove: (evt) => {
        const locationX = evt.nativeEvent.locationX;
        const newValue = getValueFromGesture(locationX);
        onValueChange(newValue);
      },
    })
  ).current;

  const thumbPosition = sliderWidth > 0
    ? ((value - minimumValue) / (maximumValue - minimumValue)) * sliderWidth
    : 0;

  const activeColor = isFrozen ? '#4A90E2' : '#26A69A';

  return (
    <View
      style={[styles.container, style]}
      onLayout={(event) => {
        setSliderWidth(event.nativeEvent.layout.width);
      }}
      ref={sliderRef}
      {...panResponder.panHandlers}
    >
      {/* Track Background */}
      <View style={styles.track}>
        {/* Active Track */}
        <View
          style={[
            styles.activeTrack,
            {
              width: `${((value - minimumValue) / (maximumValue - minimumValue)) * 100}%`,
              backgroundColor: activeColor,
            },
          ]}
        />
      </View>

      {/* Thumb */}
      {sliderWidth > 0 && (
        <View
          style={[
            styles.thumb,
            {
              left: thumbPosition - 12, // Center the thumb (24px / 2)
              backgroundColor: activeColor,
            },
            disabled && styles.thumbDisabled,
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 10,
    backgroundColor: '#E8F5F2',
    borderRadius: 5,
    overflow: 'hidden',
  },
  activeTrack: {
    height: '100%',
    borderRadius: 5,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  thumbDisabled: {
    opacity: 0.5,
  },
});