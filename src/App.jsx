import AppShell from './components/layout/AppShell.jsx'

// The app is a single-page LMS prototype. All navigation is in-memory (see the
// store's `route`), so there is no router and nothing is persisted.
export default function App() {
  return <AppShell />
}
