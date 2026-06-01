import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PrimaryButton } from '@/components/PrimaryButton';

describe('PrimaryButton', () => {
  it('renders the label', () => {
    const { getByText } = render(<PrimaryButton label="Post Item" onPress={() => {}} />);
    expect(getByText('POST ITEM')).toBeTruthy();
  });

  it('fires onPress', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<PrimaryButton label="Post Item" onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled=true', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<PrimaryButton label="Post Item" onPress={onPress} disabled />);
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('has correct accessibilityRole', () => {
    const { getByRole } = render(<PrimaryButton label="Save" onPress={() => {}} />);
    expect(getByRole('button')).toBeTruthy();
  });
});
