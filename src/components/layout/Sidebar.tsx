import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { navigationItems, secondaryNavItems } from '../../data/navigation';
import type { NavItem } from '../../types';
import './Sidebar.css';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const isActive = (item: NavItem) => {
    if (item.external) return false;
    return location.pathname === item.url || location.pathname.startsWith(item.url + '/');
  };

  const renderBadge = (badge?: NavItem['badge']) => {
    if (!badge) return null;

    const badgeClass = badge.status ? `badge-${badge.status}` : 'badge-default';

    return (
      <span className={`nav-badge ${badgeClass}`}>
        {badge.text || badge.count}
      </span>
    );
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedSections.includes(item.id);
    const active = isActive(item);

    const handleClick = (e: React.MouseEvent) => {
      if (hasSubItems) {
        e.preventDefault();
        toggleSection(item.id);
      } else if (item.external) {
        window.open(item.url, '_blank', 'noopener,noreferrer');
        e.preventDefault();
      }
      if (onClose && window.innerWidth < 768) {
        onClose();
      }
    };

    const content = (
      <>
        <span className="nav-icon" aria-hidden="true">{item.icon}</span>
        <span className="nav-label">{item.label}</span>
        {renderBadge(item.badge)}
        {hasSubItems && (
          <span className={`nav-chevron ${isExpanded ? 'expanded' : ''}`}>
            ▼
          </span>
        )}
      </>
    );

    const className = `nav-item ${active ? 'active' : ''} ${level > 0 ? 'sub-item' : ''}`;

    return (
      <li key={item.id} className="nav-item-wrapper">
        {item.external ? (
          <button
            className={className}
            onClick={handleClick}
            aria-current={active ? 'page' : undefined}
          >
            {content}
          </button>
        ) : (
          <NavLink
            to={item.url}
            className={className}
            onClick={handleClick}
            aria-current={active ? 'page' : undefined}
          >
            {content}
          </NavLink>
        )}
        
        {hasSubItems && isExpanded && (
          <ul className="sub-nav" role="list">
            {item.subItems!.map(subItem => renderNavItem(subItem, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside
      className={`sidebar ${isOpen ? 'open' : ''}`}
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="brand-icon" role="img" aria-label="Mission Control">🚀</span>
          <span className="brand-text">Mission Control</span>
        </div>
        {onClose && (
          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            ✕
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list" role="list">
          {navigationItems.map(item => renderNavItem(item))}
        </ul>

        <div className="nav-divider" />

        <ul className="nav-list secondary" role="list">
          {secondaryNavItems.map(item => renderNavItem(item))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
