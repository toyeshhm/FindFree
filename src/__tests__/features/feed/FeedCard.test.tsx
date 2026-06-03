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

  it('renders source name', () => {
    const { getByText } = render(<FeedCard item={baseItem} index={1} onPress={() => {}} />);
    expect(getByText('John Doe')).toBeTruthy();
  });

  it('shows age in meta row', () => {
    const { getByText } = render(<FeedCard item={baseItem} index={1} onPress={() => {}} />);
    // Card always shows relative age (e.g. "0m ago")
    expect(getByText(/ago/)).toBeTruthy();
  });

  it('is accessible — main card has button role with item title in label', () => {
    const { getAllByRole } = render(<FeedCard item={baseItem} index={1} onPress={() => {}} />);
    const buttons = getAllByRole('button');
    // The first button is the main card press target
    const mainBtn = buttons[0];
    expect(mainBtn.props.accessibilityLabel).toContain('Vintage Desk');
  });
});
