import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GateForm from '@/components/GateForm';
import { LanguageProvider } from '@/components/LanguageProvider';
import { confirmInvite } from '@/app/actions/auth';

vi.mock('@/app/actions/auth', () => ({
  confirmInvite: vi.fn(),
}));

function renderGate(props?: { inviteToken: string; inviteName: string }) {
  return render(
    <LanguageProvider>
      {props ? <GateForm inviteToken={props.inviteToken} inviteName={props.inviteName} /> : <GateForm />}
    </LanguageProvider>,
  );
}

// The letter only reveals after the envelope's ~1.55s open animation, so every
// test that inspects the card has to wait that out first.
const REVEAL_WAIT = { timeout: 3000 };

describe('GateForm', () => {
  beforeEach(() => {
    vi.mocked(confirmInvite).mockReset();
  });

  it('keeps the letter sealed inside the envelope until the reveal timer fires', async () => {
    const { container } = renderGate({ inviteToken: 'melissa-abc123', inviteName: 'Melissa' });

    expect(container.querySelector('.invitation-card')).not.toBeInTheDocument();
    expect(container.querySelector('.envelope-scene')).toBeInTheDocument();

    await waitFor(
      () => expect(container.querySelector('.invitation-card')).toBeInTheDocument(),
      REVEAL_WAIT,
    );
  }, 10000);

  it('renders the personal invite step with the token and greeting', async () => {
    vi.mocked(confirmInvite).mockResolvedValue(null as never);
    const { container } = renderGate({ inviteToken: 'melissa-abc123', inviteName: 'Melissa' });

    await waitFor(
      () => expect(container.querySelector('input[name="token"]')).toBeInTheDocument(),
      REVEAL_WAIT,
    );

    expect(screen.getByText(/Melissa/)).toBeInTheDocument();
    expect((container.querySelector('input[name="token"]') as HTMLInputElement).value).toBe('melissa-abc123');
  }, 10000);

  it('shows the expired-link error on invite failure', async () => {
    vi.mocked(confirmInvite).mockResolvedValue({ error: 'invalid' });
    const { container } = renderGate({ inviteToken: 'revoked-token', inviteName: 'Melissa' });

    const token = await waitFor(() => {
      const el = container.querySelector('input[name="token"]') as HTMLInputElement | null;
      if (!el) throw new Error('token input not yet rendered');
      return el;
    }, REVEAL_WAIT);
    fireEvent.submit(token.form as HTMLFormElement);

    expect(await screen.findByRole('alert')).toHaveTextContent('Este enlace ya no es válido.');
  }, 10000);

  it('shows a no-access message with no form when there is no invite token', async () => {
    const { container } = renderGate();

    await waitFor(
      () => expect(container.querySelector('.invitation-card')).toBeInTheDocument(),
      REVEAL_WAIT,
    );

    expect(container.querySelector('form')).not.toBeInTheDocument();
    expect(screen.getByText('Invitación personal')).toBeInTheDocument();
  }, 10000);
});
