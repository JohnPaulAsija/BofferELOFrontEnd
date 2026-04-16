import { render, screen } from '@testing-library/react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemeProvider } from '@/contexts/ThemeContext';

function renderWithProviders(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('ThemedText', () => {
  it('renders its children', () => {
    renderWithProviders(<ThemedText>hello world</ThemedText>);
    expect(screen.getByText('hello world')).toBeTruthy();
  });

  it('applies the title style when type="title"', () => {
    renderWithProviders(<ThemedText type="title">big</ThemedText>);
    const node = screen.getByText('big');
    const flat = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style.flat().filter(Boolean))
      : node.props.style;
    expect(flat.fontSize).toBe(32);
    expect(flat.fontWeight).toBe('bold');
  });
});
