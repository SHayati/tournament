import languages from '../../messages/config.json';

export interface Language {
    code: string;
    name: string;
    file: string;
    flag: {
        viewBox: string;
        elements: {
            type: string;
            props: any;
            children?: {
                type: string;
                props: any;
            }[];
        }[];
    };
}

export const supportedLanguages = languages as Language[];
export const locales = supportedLanguages.map((lang) => lang.code);
export const defaultLocale = 'no';
