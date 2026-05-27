const paper = '#efe5d0'
const paperDeep = '#e7d9bd'
const ink = '#2b1f14'
const inkSoft = '#6b5a44'
const crimson = '#c8553d'

export const clerkAppearance = {
  variables: {
    colorBackground: paper,
    colorText: ink,
    colorTextSecondary: inkSoft,
    colorPrimary: ink,
    colorDanger: crimson,
    colorSuccess: '#5a7a3a',
    borderRadius: '0px',
    fontFamily: 'ui-monospace, monospace',
    fontSize: '13px',
    spacingUnit: '14px',
  },
  elements: {
    // ── Root / Card ──
    rootBox: { width: '100%' },
    card: {
      background: paper,
      border: `1px solid ${ink}`,
      boxShadow: `6px 6px 0 rgba(43,31,20,0.07)`,
      borderRadius: 0,
    },

    // ── Modal overlay ──
    modalBackdrop: { backdropFilter: 'blur(2px)', background: 'rgba(43,31,20,0.22)' },
    modalContent: { border: `1px solid ${ink}`, borderRadius: 0, boxShadow: 'none' },

    // ── Header ──
    headerTitle: {
      fontFamily: 'var(--font-serif, Georgia, serif)',
      fontStyle: 'italic',
      fontWeight: '500',
      fontSize: '26px',
      color: ink,
      letterSpacing: '-0.01em',
    },
    headerSubtitle: {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '10px',
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: inkSoft,
    },
    header: {
      borderBottom: `1px solid ${ink}`,
      paddingBottom: '14px',
      marginBottom: '0',
    },

    // ── Left navbar ──
    navbar: {
      background: paperDeep,
      borderRight: `1px solid ${ink}`,
    },
    navbarButton: {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '11px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: inkSoft,
      borderRadius: 0,
    },
    navbarButtonIcon: { color: inkSoft },

    // ── Page / Content ──
    pageScrollBox: { background: paper },
    page: { background: paper },

    // ── Section titles ──
    profileSectionTitle: {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '10px',
      fontWeight: '600',
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color: inkSoft,
      borderBottom: `1px solid ${ink}`,
      paddingBottom: '6px',
    },
    profileSectionTitleText: {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '10px',
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
    },

    // ── Form elements ──
    formFieldLabel: {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '10px',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: inkSoft,
    },
    formFieldInput: {
      background: paper,
      border: `1px solid ${ink}`,
      borderRadius: 0,
      fontFamily: 'ui-monospace, monospace',
      fontSize: '13px',
      color: ink,
    },

    // ── Buttons ──
    formButtonPrimary: {
      background: ink,
      color: paper,
      border: `1px solid ${ink}`,
      borderRadius: 0,
      fontFamily: 'ui-monospace, monospace',
      fontSize: '11px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      boxShadow: 'none',
    },
    formButtonReset: {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '11px',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: inkSoft,
      borderRadius: 0,
    },

    // ── Accordion / rows ──
    accordionTriggerButton: {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '12px',
      letterSpacing: '0.06em',
      color: ink,
      borderRadius: 0,
    },

    // ── Badges ──
    badge: {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '9px',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      borderRadius: 0,
    },

    // ── UserButton popover ──
    userButtonPopoverCard: {
      background: paper,
      border: `1px solid ${ink}`,
      boxShadow: `6px 6px 0 rgba(43,31,20,0.07)`,
      borderRadius: 0,
      padding: 0,
    },
    userButtonPopoverActions: { background: paper },
    userButtonPopoverActionButton: {
      borderRadius: 0,
      padding: '10px 16px',
    },
    userButtonPopoverActionButtonText: {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '11px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: ink,
    },
    userButtonPopoverActionButtonIcon: { color: inkSoft, width: '14px', height: '14px' },
    userButtonPopoverFooter: {
      borderTop: `1px dotted rgba(43,31,20,0.3)`,
      background: paperDeep,
      padding: '8px 16px',
    },
    userPreview: {
      padding: '14px 16px',
      borderBottom: `1px solid ${ink}`,
      gap: '10px',
    },
    userPreviewMainIdentifier: {
      fontFamily: 'var(--font-serif, Georgia, serif)',
      fontStyle: 'italic',
      fontWeight: '500',
      fontSize: '17px',
      color: ink,
    },
    userPreviewSecondaryIdentifier: {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '10px',
      letterSpacing: '0.06em',
      color: inkSoft,
    },

    // ── Avatar ──
    avatarBox: {
      border: `1px solid ${ink}`,
      borderRadius: 0,
    },
    avatarImage: { borderRadius: 0 },

    // ── Footer ──
    footer: {
      background: paperDeep,
      borderTop: `1px dotted rgba(43,31,20,0.3)`,
    },
    footerAction: { display: 'none' },
  },
}
