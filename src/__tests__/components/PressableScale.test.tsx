import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { PressableScale } from '@/components/PressableScale';

describe('PressableScale', () => {
  it('renders children', () => {
    const { getByText } = render(
      <PressableScale onPress={() => {}}><Text>Tap me</Text></PressableScale>
    );
    expect(getByText('Tap me')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <PressableScale onPress={onPress}><Text>Tap</Text></PressableScale>
    );
    fireEvent.press(getByText('Tap'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <PressableScale onPress={onPress} disabled><Text>Tap</Text></PressableScale>
    );
    fireEvent.press(getByText('Tap'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
