import { useEffect } from 'react'
import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Explore from './pages/Explore.jsx'
import Categories from './pages/Categories.jsx'
import VendorDetails from './pages/VendorDetails.jsx'
import MapPage from './pages/MapPage.jsx'
import HygieneReview from './pages/HygieneReview.jsx'
import Trails from './pages/Trails.jsx'
import About from './pages/About.jsx'
import Auth from './pages/Auth.jsx'
import Admin from './pages/Admin.jsx'

/** Route change → scroll top; /#how → scroll to the section. */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        const t = setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 60)
        return () => clearTimeout(t)
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

function NotFound() {
  return (
    <div className="section flex flex-col items-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
        <MapPin className="h-8 w-8 text-brand" />
      </div>
      <h1 className="text-3xl font-extrabold">You seem lost!</h1>
      <p className="mt-2 text-ink/60">This page isn’t on any of our food trails.</p>
      <Link to="/" className="btn-primary mt-6">Back to Home</Link>
    </div>
  )
}

function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/trails" element={<Trails />} />
          <Route path="/vendor/:id" element={<VendorDetails />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/review" element={<HygieneReview />} />
          <Route path="/review/:id" element={<HygieneReview />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </>
  )
}
