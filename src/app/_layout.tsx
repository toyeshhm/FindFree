import React from 'react';
import { View, Text } from 'react-native';

export function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#3D3D39', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#F5F1E8' }}>FindFree</Text>
    </View>
  );
}
