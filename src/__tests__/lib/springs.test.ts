import { Springs } from '@/lib/springs';

describe('Springs', () => {
  it('has the 6 motion presets', () => {
    expect(Object.keys(Springs)).toEqual(
      expect.arrayContaining(['standard', 'heavy', 'snappy', 'gentle', 'stamp', 'drop']),
    );
    expect(Object.keys(Springs)).toHaveLength(6);
  });
  it('all presets have stiffness, damping, mass', () => {
    for (const preset of Object.values(Springs)) {
      expect(preset).toHaveProperty('stiffness');
      expect(preset).toHaveProperty('damping');
      expect(preset).toHaveProperty('mass');
    }
  });
});
