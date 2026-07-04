'use client';

import { useActionState, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { confirmInvite } from '@/app/actions/auth';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from './LanguageProvider';

type Phase = 'sealed' | 'opening' | 'revealing' | 'done';

type GateFormProps = { inviteToken: string; inviteName: string } | Record<string, never>;

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export default function GateForm(props: GateFormProps) {
  const isInvite = 'inviteToken' in props;
  const { t } = useLanguage();
  const [inviteState, inviteAction, invitePending] = useActionState(confirmInvite, null);
  const [phase, setPhase] = useState<Phase>('sealed');
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      const timer = setTimeout(() => setPhase('done'), 0);
      return () => clearTimeout(timer);
    }
    const timers = [
      setTimeout(() => setPhase('opening'),   600),
      setTimeout(() => setPhase('revealing'), 1900),
      setTimeout(() => setPhase('done'),      3400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [prefersReducedMotion]);

  const showEnvelope = phase === 'sealed' || phase === 'opening';
  const paperInEnvelope = showEnvelope;
  const morphTransition = { duration: prefersReducedMotion ? 0 : 0.95, ease: EASE_OUT };

  const inviteErrorMsg = inviteState && 'error' in inviteState ? t.gate.inviteExpired : null;

  // Reveal the card's text one line at a time, like ink appearing as it's written.
  const linesContainer = {
    hidden: {},
    show: {
      transition: {
        delayChildren: prefersReducedMotion ? 0 : 0.45,
        staggerChildren: prefersReducedMotion ? 0 : 0.24,
      },
    },
  };
  const lineItem = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.6, ease: EASE_OUT },
    },
  };

  return (
    <div className="wedding-paper min-h-screen flex flex-col items-center justify-center px-4 gap-4" data-access-mode={isInvite ? 'invite' : 'no-access'}>
      {/* Language switcher: fixed corner so it never overlaps the envelope animation */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* The envelope shell and the "paper" (ghost-letter → invitation card) are
          stacked in the same grid cell so the paper can morph smoothly between
          the two without a hard cut when the envelope disappears. */}
      <div className="gate-stack">
        <AnimatePresence>
          {showEnvelope && (
            <motion.div
              key="envelope"
              className="envelope-scene"
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -6 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: EASE_OUT }}
            >
              <div className="envelope-body">
                <div className="envelope-fold-left" />
                <div className="envelope-fold-right" />
                <div className="envelope-fold-bottom" />

                <div className={`envelope-flap-wrap${phase === 'opening' ? ' is-opening' : ''}`}>
                  <div className="envelope-flap-shape">
                    <span className="envelope-wax-seal">T · M</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {paperInEnvelope ? (
            <motion.div
              key="ghost-letter"
              layoutId="gate-paper"
              className="envelope-ghost-letter"
              transition={morphTransition}
            >
              <div className="envelope-ghost-line" />
              <div className="envelope-ghost-line" />
              <div className="envelope-ghost-line" />
            </motion.div>
          ) : (
            <motion.div
              key="invitation-card"
              layoutId="gate-paper"
              className="invitation-card"
              transition={morphTransition}
            >
              <motion.div variants={linesContainer} initial="hidden" animate="show">
                <motion.h1
                  variants={lineItem}
                  className="font-display text-5xl md:text-6xl text-center text-green mb-2"
                >
                  {isInvite ? t.gate.title : t.gate.noAccessTitle}
                </motion.h1>

                {isInvite ? (
                  <>
                    <motion.p
                      variants={lineItem}
                      className="font-body text-center text-charcoal/60 text-sm mb-8 leading-relaxed"
                    >
                      {t.gate.personalGreetingPrefix} {props.inviteName}
                    </motion.p>

                    <motion.form variants={lineItem} action={inviteAction} className="space-y-4">
                      <input type="hidden" name="token" value={props.inviteToken} />

                      {inviteErrorMsg && (
                        <p className="font-body text-sm text-red-600" role="alert">
                          {inviteErrorMsg}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={invitePending}
                        className="w-full bg-green hover:bg-green-light text-white font-body font-semibold rounded-lg py-2.5 transition-colors disabled:opacity-60 mt-2"
                      >
                        {invitePending ? t.gate.entering : t.gate.continue}
                      </button>
                    </motion.form>
                  </>
                ) : (
                  <motion.p
                    variants={lineItem}
                    className="font-body text-center text-charcoal/60 text-sm leading-relaxed"
                  >
                    {t.gate.noAccessBody}
                  </motion.p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
