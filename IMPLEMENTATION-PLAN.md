# Implementation Plan - US-127 Fix Mission Control Notification & Settings Icons

## Approach

The TopBar already renders notification (🔔) and settings (⚙️) icon buttons, but they had no click handlers and no UI to open.

Implement two small popover panels (Notifications + Settings) inside `TopBar.tsx`, using the existing TopBar styling patterns:

- Add `showNotifications` / `showSettings` state
- Wire `onClick` handlers to toggle the correct panel
- Ensure only one panel/menu is open at a time (notifications, settings, user menu)
- Add click-outside + Escape-to-close behavior for proper UX
- Add visual feedback for open state via `is-open` class and active press styling

## Files to Modify

- `src/components/layout/TopBar.tsx`
  - Add state + event handlers
  - Add popover panel markup
  - Add outside-click and Escape handlers
  - Replace raw `<a href>` menu items with `react-router-dom` `<Link>` to avoid full reload

- `src/components/layout/TopBar.css`
  - Add styles for popover panels (`.topbar-panel*`)
  - Add click/active feedback (`:active`) and open-state styling (`.is-open`)

## Implementation Order

1. Add state + handlers in `TopBar.tsx`
2. Add popover panel markup for notifications + settings
3. Add click-outside logic (mousedown) + Escape-to-close
4. Add CSS for panel layout + open/active visual states
5. Run `npm run build` to confirm no TS/compile errors

## Selector / Event Decisions

- Event: `document.addEventListener('mousedown', ...)` for click-outside behavior
  - Rationale: closes panels earlier than `click` and matches common UI behavior
- Containment checks via React refs (`notificationsContainerRef`, `settingsContainerRef`, `userMenuContainerRef`)
  - Rationale: avoids brittle CSS selectors and keeps logic tied to rendered DOM

## Estimated Time

- Planning: 5 min
- Implementation: 15 min
- Build/test: 5 min
- Report + commit: 5 min

---

**Created:** 2026-02-13
**Status:** Ready to implement
