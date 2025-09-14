import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DurationInput } from './DurationInput';

describe('DurationInput', () => {
  const defaultProps = {
    label: 'Work Duration',
    value: 25,
    min: 1,
    max: 120,
    suffix: 'minutes',
    onChange: vi.fn(),
  };

  // beforeEach(() => {
  //   vi.clearAllMocks();
  // });

  describe('Rendering', () => {
    it('should render the label', () => {
      render(<DurationInput {...defaultProps} />);
      expect(screen.getByText('Work Duration')).toBeInTheDocument();
    });

    it('should display the current value', () => {
      render(<DurationInput {...defaultProps} value={30} />);
      expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    });

    it('should render with suffix when provided', () => {
      render(<DurationInput {...defaultProps} />);
      expect(screen.getByText('minutes')).toBeInTheDocument();
    });

    it('should render without suffix when not provided', () => {
      const { suffix, ...propsWithoutSuffix } = defaultProps;
      render(<DurationInput {...propsWithoutSuffix} />);
      expect(screen.queryByText('minutes')).not.toBeInTheDocument();
    });

    it('should render increment and decrement buttons', () => {
      render(<DurationInput {...defaultProps} />);

      // Using getByRole to find buttons by their accessibility role
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);

      // Check for button content (+ and - symbols)
      expect(screen.getByText('+')).toBeInTheDocument();
      expect(screen.getByText('−')).toBeInTheDocument();
    });
  });

  describe('Value Changes', () => {
    it('should call onChange when increment button is clicked', () => {
      const mockOnChange = vi.fn();
      render(
        <DurationInput {...defaultProps} value={25} onChange={mockOnChange} />
      );

      fireEvent.click(screen.getByText('+'));
      expect(mockOnChange).toHaveBeenCalledWith(26);
    });

    it('should call onChange when decrement button is clicked', () => {
      const mockOnChange = vi.fn();
      render(
        <DurationInput {...defaultProps} value={25} onChange={mockOnChange} />
      );

      fireEvent.click(screen.getByText('−'));
      expect(mockOnChange).toHaveBeenCalledWith(24);
    });

    it('should call onChange when input value changes', () => {
      const mockOnChange = vi.fn();
      render(<DurationInput {...defaultProps} onChange={mockOnChange} />);

      const input = screen.getByDisplayValue('25');
      fireEvent.change(input, { target: { value: '30' } });

      expect(mockOnChange).toHaveBeenCalledWith(30);
    });

    it('should handle direct input of valid numbers', () => {
      const mockOnChange = vi.fn();
      render(<DurationInput {...defaultProps} onChange={mockOnChange} />);

      const input = screen.getByDisplayValue('25');
      fireEvent.change(input, { target: { value: '45' } });

      expect(mockOnChange).toHaveBeenCalledWith(45);
    });
  });

  describe('Validation and Boundaries', () => {
    it('should not increment beyond max value', () => {
      const mockOnChange = vi.fn();
      render(
        <DurationInput
          {...defaultProps}
          value={120}
          max={120}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByText('+'));
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should not decrement below min value', () => {
      const mockOnChange = vi.fn();
      render(
        <DurationInput
          {...defaultProps}
          value={1}
          min={1}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByText('−'));
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should clamp direct input to max value', () => {
      const mockOnChange = vi.fn();
      render(
        <DurationInput
          {...defaultProps}
          min={1}
          max={60}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByDisplayValue('25');
      fireEvent.change(input, { target: { value: '150' } });

      expect(mockOnChange).toHaveBeenCalledWith(60);
    });

    it('should clamp direct input to min value', () => {
      const mockOnChange = vi.fn();
      render(
        <DurationInput
          {...defaultProps}
          min={5}
          max={60}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByDisplayValue('25');
      fireEvent.change(input, { target: { value: '2' } });

      expect(mockOnChange).toHaveBeenCalledWith(5);
    });

    it('should handle invalid input gracefully', () => {
      const mockOnChange = vi.fn();
      render(<DurationInput {...defaultProps} onChange={mockOnChange} />);

      const input = screen.getByDisplayValue('25');
      fireEvent.change(input, { target: { value: 'abc' } });

      // For number inputs, browsers often convert invalid input to empty string
      // which triggers our empty input handling (sets to min value)
      expect(mockOnChange).toHaveBeenCalledWith(1);
    });

    it('should handle empty input', () => {
      const mockOnChange = vi.fn();
      render(<DurationInput {...defaultProps} onChange={mockOnChange} />);

      const input = screen.getByDisplayValue('25');
      fireEvent.change(input, { target: { value: '' } });

      // Should call onChange with min value when input is empty
      expect(mockOnChange).toHaveBeenCalledWith(1);
    });

    it('should handle zero input by using min value', () => {
      const mockOnChange = vi.fn();
      render(
        <DurationInput {...defaultProps} min={1} onChange={mockOnChange} />
      );

      const input = screen.getByDisplayValue('25');
      fireEvent.change(input, { target: { value: '0' } });

      expect(mockOnChange).toHaveBeenCalledWith(1);
    });
  });

  describe('Button States', () => {
    it('should disable increment button when at max value', () => {
      render(<DurationInput {...defaultProps} value={120} max={120} />);

      const incrementButton = screen.getByLabelText('Increase Work Duration');
      expect(incrementButton).toBeDisabled();
    });

    it('should disable decrement button when at min value', () => {
      render(<DurationInput {...defaultProps} value={1} min={1} />);

      const decrementButton = screen.getByLabelText('Decrease Work Duration');
      expect(decrementButton).toBeDisabled();
    });

    it('should enable both buttons when value is between min and max', () => {
      render(<DurationInput {...defaultProps} value={25} min={1} max={120} />);

      const incrementButton = screen.getByText('+');
      const decrementButton = screen.getByText('−');

      expect(incrementButton).not.toBeDisabled();
      expect(decrementButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for buttons', () => {
      render(<DurationInput {...defaultProps} label="Work Duration" />);

      const incrementButton = screen.getByLabelText('Increase Work Duration');
      const decrementButton = screen.getByLabelText('Decrease Work Duration');

      expect(incrementButton).toBeInTheDocument();
      expect(decrementButton).toBeInTheDocument();
    });

    it('should associate input with label', () => {
      render(<DurationInput {...defaultProps} />);

      const input = screen.getByLabelText('Work Duration');
      expect(input).toBeInTheDocument();
    });

    it('should have correct input attributes', () => {
      render(<DurationInput {...defaultProps} />);

      const input = screen.getByDisplayValue('25');
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('min', '1');
      expect(input).toHaveAttribute('max', '120');
    });
  });

  describe('Edge Cases', () => {
    it('should handle decimal input by rounding to nearest integer', () => {
      const mockOnChange = vi.fn();
      render(<DurationInput {...defaultProps} onChange={mockOnChange} />);

      const input = screen.getByDisplayValue('25');
      fireEvent.change(input, { target: { value: '25.7' } });

      expect(mockOnChange).toHaveBeenCalledWith(26);
    });

    it('should handle negative input by using min value', () => {
      const mockOnChange = vi.fn();
      render(
        <DurationInput {...defaultProps} min={1} onChange={mockOnChange} />
      );

      const input = screen.getByDisplayValue('25');
      fireEvent.change(input, { target: { value: '-5' } });

      expect(mockOnChange).toHaveBeenCalledWith(1);
    });

    it('should handle very large numbers by clamping to max', () => {
      const mockOnChange = vi.fn();
      render(
        <DurationInput {...defaultProps} max={120} onChange={mockOnChange} />
      );

      const input = screen.getByDisplayValue('25');
      fireEvent.change(input, { target: { value: '999999' } });

      expect(mockOnChange).toHaveBeenCalledWith(120);
    });
  });

  describe('Visual Feedback', () => {
    it('should apply appropriate CSS classes based on state', () => {
      render(<DurationInput {...defaultProps} />);

      const input = screen.getByDisplayValue('25');
      expect(input).toHaveClass('border-gray-300');

      // Focus should change border color
      fireEvent.focus(input);
      expect(input).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
    });

    it('should show disabled state styling for buttons at limits', () => {
      render(<DurationInput {...defaultProps} value={120} max={120} />);

      const incrementButton = screen.getByLabelText('Increase Work Duration');
      expect(incrementButton).toHaveClass('disabled:opacity-50');
    });
  });
});
