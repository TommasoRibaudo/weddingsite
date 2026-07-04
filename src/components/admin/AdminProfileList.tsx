'use client';
import GuestAvatar from '@/components/profile/GuestAvatar';

export type AdminProfile = {
  guest_name: string;
  bio: string | null;
  photo_url: string | null;
  updated_at: string;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminProfileList({ profiles }: { profiles: AdminProfile[] }) {
  if (profiles.length === 0) {
    return <p className="font-body text-gray-400 italic">No guest profiles yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {profiles.map((profile) => (
        <div
          key={profile.guest_name}
          className="flex gap-3 border border-greige rounded-lg p-4 bg-white"
        >
          <GuestAvatar name={profile.guest_name} photoUrl={profile.photo_url} size={48} />
          <div className="min-w-0 flex-1">
            <p className="font-body font-semibold text-gray-800 truncate">{profile.guest_name}</p>
            <p className="font-body text-xs text-gray-400 mb-1">
              Updated {formatDate(profile.updated_at)}
            </p>
            {profile.bio ? (
              <p className="font-body text-sm text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
            ) : (
              <p className="font-body text-sm text-gray-400 italic">No bio yet.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
