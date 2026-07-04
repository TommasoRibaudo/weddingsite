'use client';

const sections = [
  { id: 'photos', label: 'Feed & Comments' },
  { id: 'gifts', label: 'Gifts' },
  { id: 'dietary', label: 'Dietary' },
  { id: 'invites', label: 'Invite Links' },
  { id: 'profiles', label: 'Guest Profiles' },
];

export default function AdminSectionNav() {
  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    window.history.replaceState(null, '', `#${sectionId}`);
  }

  return (
    <div className="flex gap-6 border-b border-greige mb-8">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => scrollToSection(section.id)}
          className="font-body font-semibold text-gray-700 pb-3 hover:text-green transition-colors"
        >
          {section.label}
        </button>
      ))}
    </div>
  );
}
