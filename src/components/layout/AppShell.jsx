import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'
import Router from '../Router.jsx'

// The persistent LMS frame: fixed sidebar + a scrollable content column with a
// sticky top bar. Pages render inside the centered content container.
export default function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="mx-auto max-w-5xl">
            <Router />
          </div>
        </main>
      </div>
    </div>
  )
}
