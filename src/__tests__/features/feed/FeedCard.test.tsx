import React from 'react';
import { render } from '@testing-library/react-native';
import { FeedCard } from '@/features/feed/FeedCard';
import type { Item } from '@/types';

const baseItem: Item = {
  id: '1', title: 'Vintage Desk', description: 'Nice desk', category: 'furniture',
  location: { lat: 37.78, lng: -122.41 }, photoUrls: [], source: 'user',
  sourceName: 'John Doe',
  claimType: 'in-store',
  status: 'available', createdAt: new Date().toISOString(),
  expiresAt: new Date().toISOString(), distanceMi: 1.2,
};

describe('FeedCard', () => {
  it('renders item title', () => {
    const { getByText } = render(<FeedCard item={baseItem} index={1} onPress={() => {}} />);
    expect(getByText('Vintage Desk')).toBeTruthy();
  });

  it('renders FREE badge', () => {
    const { getByText } = render(<FeedCard item={baseItem} index={1} onPress={() => {}} />);
    expect(getByText('FREE')).toBeTruthy();
  });

  it('shows distance in meta', () => {
    const { getByText } = render(<FeedCard item={baseItem} index={1} onPress={() => {}} />);
    expect(getByText(/1\.2 mi/)).toBeTruthy();
  });

  it('is accessible as a button with title + distance label', () => {
    const { getByRole } = render(<FeedCard item={baseItem} index={1} onPress={() => {}} />);
    const btn = getByRole('button');
    expect(btn.props.accessibilityLabel).toContain('Vintage Desk');
    expect(btn.props.accessibilityLabel).toContain('1.2 mi');
  });
});
