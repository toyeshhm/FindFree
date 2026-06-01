import { Springs } from '@/lib/springs';

describe('Springs', () => {
  it('has 4 presets', () => {
    expect(Object.keys(Springs)).toHaveLength(4);
  });
  it('all presets have stiffness, damping, mass', () => {
    for (const preset of Object.values(Springs)) {
      expect(preset).toHaveProperty('stiffness');
      expect(preset).toHaveProperty('damping');
      expect(preset).toHaveProperty('mass');
    }
  });
});
