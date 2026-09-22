import type { Project } from '../types';
import { getProjectDisplayCategory, getProjectDisplaySubtitle } from '../../shared/project-metadata';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface LocaleAlternate {
  hrefLang: string;
  href: string;
}

const SITE_URL = 'https://www.up-brands.com';

export function getCanonicalUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

function stripLanguageParam(url: URL) {
  url.searchParams.delete('lng');
  return url;
}

export function getLanguageTag(language?: string) {
  if (!language) return 'en';
  if (language === 'zh-TW' || language === 'zh-HK' || language === 'zh-MO') return 'zh-TW';
  if (language.startsWith('zh')) return 'zh-CN';
  return 'en';
}

export function getLocalizedUrl(url: string, language?: string) {
  const nextUrl = new URL(url);
  const locale = getLanguageTag(language);

  if (locale === 'en') {
    return stripLanguageParam(nextUrl).toString();
  }

  nextUrl.searchParams.set('lng', locale);
  return nextUrl.toString();
}

export function getLanguageAlternates(url: string): LocaleAlternate[] {
  const baseUrl = stripLanguageParam(new URL(url)).toString();

  return [
    { hrefLang: 'x-default', href: baseUrl },
    { hrefLang: 'en', href: getLocalizedUrl(baseUrl, 'en') },
    { hrefLang: 'zh-CN', href: getLocalizedUrl(baseUrl, 'zh-CN') },
    { hrefLang: 'zh-TW', href: getLocalizedUrl(baseUrl, 'zh-TW') },
  ];
}

function toCategoryText(project: Pick<Project, 'category' | 'subtitle'>) {
  const text = getProjectDisplayCategory(project) || getProjectDisplaySubtitle(project);
  if (!text) return 'brand design';

  return text
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' / ')
    .toLowerCase();
}

export function getProjectImageAlt(project: Pick<Project, 'title' | 'category' | 'subtitle'>, detailIndex?: number) {
  const categoryText = toCategoryText(project);
  const suffix = typeof detailIndex === 'number' ? ` detail image ${detailIndex + 1}` : ' case study cover image';

  return `${project.title} ${categoryText} ${suffix}`.trim();
}

export function getBlogImageAlt(title: string, tags?: string[]) {
  const topic = tags?.filter(Boolean).slice(0, 2).join(' / ').toLowerCase();
  return topic ? `${title} article cover image about ${topic}` : `${title} article cover image`;
}

export function getBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
