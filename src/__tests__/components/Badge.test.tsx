import React from 'react';
import { render } from '@testing-library/react-native';
import { Badge } from '@/components/Badge';

describe('Badge', () => {
  it('renders the label', () => {
    const { getByText } = render(<Badge label="FREE" />);
    expect(getByText('FREE')).toBeTruthy();
  });

  it('is hidden from accessibility when accessibilityHidden is true', () => {
    const { getByText } = render(<Badge label="FREE" accessibilityHidden />);
    expect(getByText('FREE').props.accessible).toBe(false);
  });
});
