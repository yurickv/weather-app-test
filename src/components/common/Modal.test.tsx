import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<Modal open={false} title="X" onCancel={() => {}} mode="confirm" />);
    expect(container).toBeEmptyDOMElement();
  });
  it('confirm mode fires onConfirm and onCancel', async () => {
    const onConfirm = vi.fn(); const onCancel = vi.fn();
    render(<Modal open title="Delete?" mode="confirm" confirmLabel="Delete" cancelLabel="Cancel"
      onConfirm={onConfirm} onCancel={onCancel} />);
    await userEvent.click(screen.getByText('Delete'));
    await userEvent.click(screen.getByText('Cancel'));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
