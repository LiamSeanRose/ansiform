/**
 * Breadcrumb trail (#92) — orientation for the deep `/tasks/:task` hierarchy
 * (a11y guideline `breadcrumb-web`: use breadcrumbs for 3+ level depth).
 *
 * A `<nav aria-label>` wrapping an ordered list; the final crumb is the current
 * page (`aria-current="page"`, not a link). Link crumbs are React Router `Link`s.
 * Presentational — copy and hrefs come from the caller.
 */
import { Link } from 'react-router-dom';

export interface Crumb {
  label: string;
  /** Omit for the current (last) crumb — rendered as plain text. */
  to?: string;
}

export interface BreadcrumbsProps {
  items: Crumb[];
  /** Accessible name for the nav landmark (e.g. "Breadcrumb"). */
  label: string;
}

export function Breadcrumbs({ items, label }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs" aria-label={label}>
      <ol className="breadcrumbs__list">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li className="breadcrumbs__item" key={`${item.label}-${i}`}>
              {item.to && !last ? (
                <Link className="breadcrumbs__link" to={item.to}>
                  {item.label}
                </Link>
              ) : (
                <span className="breadcrumbs__current" aria-current={last ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
