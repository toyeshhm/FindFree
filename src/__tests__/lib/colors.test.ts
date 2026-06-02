import { Colors } from '@/lib/colors';

describe('Colors — Cartographer\'s Cache palette', () => {
  it('Map Beige parchment is the ground color', () => {
    expect(Colors.BACKGROUND).toBe('#F3E4C6');
  });
  it('Warm ink is the primary text color', () => {
    expect(Colors.TEXT_PRIMARY).toBe('#211F18');
  });
  it('Antique brass is the primary accent', () => {
    expect(Colors.ACCENT).toBe('#8A6E32');
  });
  it('Sealing-wax red exists for stamps and alerts', () => {
    expect(Colors.SEALING_WAX).toBe('#9E2B25');
  });
  it('no pure black or pure white', () => {
    const values = Object.values(Colors);
    expect(values).not.toContain('#000000');
    expect(values).not.toContain('#FFFFFF');
    expect(values).not.toContain('#fff');
    expect(values).not.toContain('#000');
  });
});
