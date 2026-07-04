import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UploadZone from '@/components/gallery/UploadZone';
import { LanguageProvider } from '@/components/LanguageProvider';
import { postTextPost } from '@/app/actions/gallery';

const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/app/actions/gallery', () => ({
  postTextPost: vi.fn(),
}));

function renderUploadZone() {
  return render(
    <LanguageProvider>
      <UploadZone />
    </LanguageProvider>,
  );
}

describe('UploadZone', () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.mocked(postTextPost).mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('keeps the note submit button disabled for empty messages', () => {
    renderUploadZone();

    expect(screen.getByRole('button', { name: /publicar/i })).toBeDisabled();
  });

  it('posts a note and refreshes the route', async () => {
    vi.mocked(postTextPost).mockResolvedValue({ ok: true });
    renderUploadZone();

    fireEvent.change(screen.getByLabelText(/comparte una nota/i), {
      target: { value: 'A lovely memory' },
    });
    fireEvent.click(screen.getByRole('button', { name: /publicar/i }));

    await waitFor(() => {
      expect(postTextPost).toHaveBeenCalledWith('A lovely memory');
      expect(refresh).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/publicado/i)).toBeInTheDocument();
  });

  it('shows upload errors returned by the API', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid file type.' }),
    } as Response);
    const { container } = renderUploadZone();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['not an image'], 'notes.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText('notes.txt')).toBeInTheDocument();
    expect(await screen.findByText('Invalid file type.')).toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
