'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useEffect, useRef, useState } from 'react';
import { supportedLanguages } from '@/i18n/settings';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const switchLocale = (newLocale: string) => {
        // @ts-ignore
        router.replace(pathname, { locale: newLocale });
        setOpen(false);
    };

    const renderFlag = (flagProps: any) => {
        return (
            <svg
                viewBox={flagProps.viewBox}
                width="20"
                height="20"
                className="mr-2 rounded-sm shadow-sm"
                xmlns="http://www.w3.org/2000/svg"
            >
                {flagProps.elements.map((el: any, index: number) => {
                    if (el.type === 'rect') return <rect key={index} {...el.props} />;
                    if (el.type === 'path') return <path key={index} {...el.props} />;
                    if (el.type === 'g') return (
                        <g key={index} {...el.props}>
                            {el.children?.map((child: any, childIndex: number) => (
                                <path key={childIndex} {...child.props} />
                            ))}
                        </g>
                    );
                    return null;
                })}
            </svg>
        );
    };

    const currentLang = supportedLanguages.find(l => l.code === locale) || supportedLanguages[0];

    return (
        <div className="relative inline-block text-left mr-4 z-50" ref={ref}>
            <button
                type="button"
                className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 items-center"
                id="menu-button"
                aria-expanded={open}
                aria-haspopup="true"
                onClick={() => setOpen(!open)}
            >
                {renderFlag(currentLang.flag)}
                {currentLang.name}
                <svg className="-mr-1 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
            </button>

            {open && (
                <div
                    className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                    tabIndex={-1}
                >
                    <div className="py-1" role="none">
                        {supportedLanguages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => switchLocale(lang.code)}
                                className={`flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${locale === lang.code ? 'bg-gray-50' : ''}`}
                                role="menuitem"
                                tabIndex={-1}
                            >
                                {renderFlag(lang.flag)}
                                {lang.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
