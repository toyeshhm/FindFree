import { Colors } from '@/lib/colors';

describe('Colors', () => {
  it('has 10 tokens', () => {
    expect(Object.keys(Colors)).toHaveLength(10);
  });
  it('CHARCOAL is the ground color', () => {
    expect(Colors.CHARCOAL).toBe('#3D3D39');
  });
  it('CREAM is the primary text color', () => {
    expect(Colors.CREAM).toBe('#F5F1E8');
  });
  it('RUST is the single accent', () => {
    expect(Colors.RUST).toBe('#8B6F47');
  });
  it('no pure black or pure white', () => {
    const values = Object.values(Colors);
    expect(values).not.toContain('#000000');
    expect(values).not.toContain('#FFFFFF');
  });
});
