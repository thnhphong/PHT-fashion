import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'vi', label: 'VI' },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
  };

  const currentLang = i18n.language.split('-')[0];

  return (
    <div className="flex items-center gap-1.5 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full p-1 border border-gray-200/50 dark:border-gray-700/50 shadow-sm transition-all duration-300">
      <div className="pl-1.5 pr-0.5">
        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex gap-1 relative">
        {languages.map((lang) => {
          const isActive = currentLang === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`relative px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-full transition-all duration-300 z-10 ${
                isActive
                  ? 'text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeLang"
                  className="absolute inset-0 bg-primary rounded-full -z-10 shadow-sm shadow-primary/20"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {lang.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
