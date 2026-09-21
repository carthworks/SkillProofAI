import { useEffect, useRef } from 'react';

/**
 * Developer Console Signature & DevTools Branding
 * Implements the developer-console-signature skill:
 * - 6 Core Pillars: Author Profile, Project Metadata, CSS Token Styling, Interactive DevTools API, Safety, Security/Bug Bounty.
 */
export default function ConsoleSignature() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (typeof window === 'undefined') return;

    const bannerStyle =
      'font-size: 15px; font-weight: 800; background: linear-gradient(135deg, #059669, #0284c7); color: #ffffff; padding: 6px 14px; border-radius: 6px; text-shadow: 0 1px 2px rgba(0,0,0,0.5); font-family: "Space Grotesk", system-ui, sans-serif;';
    const labelStyle = 'font-weight: 700; color: #10b981; font-family: monospace;';
    const textStyle = 'color: #94a3b8; font-family: monospace;';
    const linkStyle = 'color: #38bdf8; font-weight: 600; text-decoration: underline; font-family: monospace;';
    const quoteStyle = 'font-style: italic; color: #6ee7b7; font-family: monospace;';
    const tipLabel = 'font-weight: bold; color: #f59e0b; font-family: monospace;';
    const codeTag = 'color: #10b981; background: rgba(16,185,129,0.15); padding: 2px 6px; border-radius: 4px; font-weight: bold; font-family: monospace;';

    console.log('%c🛡️ SkillProofAI — Performance-Verified Engineering Talent', bannerStyle);
    console.log(
      '%c👨‍💻 Developer:%c Karthikeyan T (@carthworks)\n' +
      '%c✉️  Email:     %ctkarthikeyan@gmail.com\n' +
      '%c💼 LinkedIn:  %chttps://www.linkedin.com/in/carthworks\n' +
      '%c🐙 GitHub:    %chttps://github.com/carthworks\n' +
      '%c📦 Project:   %cSkillProofAI (TalentForge POC)\n' +
      '%c📜 License:   %cApache-2.0\n' +
      '%c🔒 Security:  %csecurity@skillproof.ai (Responsible Disclosure)\n' +
      '%c✨ Mission:   %c"Replacing résumé inflation with tamper-proof cryptographic code proofs."',
      labelStyle, textStyle,
      labelStyle, linkStyle,
      labelStyle, linkStyle,
      labelStyle, linkStyle,
      labelStyle, textStyle,
      labelStyle, textStyle,
      labelStyle, linkStyle,
      labelStyle, quoteStyle
    );

    console.log(
      `%c💡 DevTools Helper:%c Run %cSkillProofAI.help()%c in this console to interactively inspect platform tools and metadata!`,
      tipLabel,
      textStyle,
      codeTag,
      textStyle
    );

    // Global DevTools Helper (SkillProofAI & TalentForge alias)
    const devToolsHelper = {
      version: '1.0.0',
      developer: {
        name: 'Karthikeyan T',
        handle: '@carthworks',
        email: 'tkarthikeyan@gmail.com',
        linkedIn: 'https://www.linkedin.com/in/carthworks',
        github: 'https://github.com/carthworks',
      },
      project: {
        name: 'SkillProofAI (TalentForge)',
        stack: 'React 18 + Vite + TailwindCSS + Express + Prisma + BullMQ + Docker',
        license: 'Apache-2.0',
        securityContact: 'security@skillproof.ai',
      },
      help: () => {
        console.table({
          'SkillProofAI.version': 'Platform version',
          'SkillProofAI.developer': 'Developer profile & social coordinates',
          'SkillProofAI.project': 'Tech stack, license & architecture',
          'SkillProofAI.contact()': 'Display contact & security email',
        });
        return '🚀 Ready to inspect!';
      },
      contact: () => {
        console.log(
          '%c📬 Contact & Security Disclosure:\n' +
          '• Developer: tkarthikeyan@gmail.com\n' +
          '• Security:  security@skillproof.ai\n' +
          '• LinkedIn:  https://www.linkedin.com/in/carthworks',
          'color: #38bdf8; font-family: monospace;'
        );
        return '📬 Feel free to reach out!';
      },
    };

    (window as any).SkillProofAI = devToolsHelper;
    (window as any).TalentForge = devToolsHelper;
  }, []);

  return null;
}

