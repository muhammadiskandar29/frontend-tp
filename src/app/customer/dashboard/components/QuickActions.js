"use client";

import { useRouter } from "next/navigation";

export default function QuickActions({ unpaidCount = 0, onProfileClick }) {
  const router = useRouter();

  const actions = [
    {
      id: 'payment',
      label: 'Pembayaran',
      description: unpaidCount > 0
        ? `${unpaidCount} order menunggu pembayaran`
        : 'Lengkapi pembayaran order',
      icon: '💳',
      href: '/customer/dashboard/payment',
      highlight: unpaidCount > 0,
      badge: unpaidCount > 0 ? unpaidCount : null,
    },
    {
      id: 'profile',
      label: 'Profil',
      description: 'Kelola data pribadi Anda',
      icon: '👤',
      href: '#',
      onClick: () => {
        if (onProfileClick) {
          onProfileClick();
        }
      },
    },
    {
      id: 'help',
      label: 'Bantuan',
      description: 'Butuh bantuan? Hubungi kami',
      icon: '💬',
      href: '#',
      onClick: () => {
        // Open help/contact
        console.log('Open help');
      },
    },
  ];

  return (
    <section className="quick-actions-section">
      <h2>Aksi Cepat</h2>
      <div className="quick-actions-grid">
        {actions.map((action) => (
          <button
            key={action.id}
            className={`quick-action-card ${action.highlight ? 'highlight' : ''}`}
            onClick={() => {
              if (action.onClick) {
                action.onClick();
              } else if (action.href && action.href !== '#') {
                router.push(action.href);
              }
            }}
          >
            <div className="quick-action-card__icon">{action.icon}</div>
            <div className="quick-action-card__content">
              <div className="quick-action-card__header">
                <strong>{action.label}</strong>
                {action.badge && (
                  <span className="quick-action-badge">{action.badge}</span>
                )}
              </div>
              <p>{action.description}</p>
            </div>
            <svg
              className="quick-action-card__arrow"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
    </section>
  );
}


