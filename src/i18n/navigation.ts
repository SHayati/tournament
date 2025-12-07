import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

import { locales, defaultLocale } from './settings';

export const routing = defineRouting({
    locales,
    defaultLocale,
    localePrefix: 'never'
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
