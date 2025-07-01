import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import PostDetail from './pages/PostDetail'
import RequireAuth from './components/RequireAuth'

function App() {
    const { user } = useAuth()

    return (
        <div className="min-h-screen bg-gray-50">
            {user && <Navbar />}
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <Routes>
                    {/* Public routes */}
                    <Route
                        path="/login"
                        element={user ? <Navigate to="/" replace /> : <Login />}
                    />
                    <Route
                        path="/register"
                        element={user ? <Navigate to="/" replace /> : <Register />}
                    />

                    {/* Protected routes */}
                    <Route path="/" element={
                        <RequireAuth>
                            <Feed />
                        </RequireAuth>
                    } />
                    <Route path="/profile" element={
                        <RequireAuth>
                            <Profile />
                        </RequireAuth>
                    } />
                    <Route path="/post/:id" element={
                        <RequireAuth>
                            <PostDetail />
                        </RequireAuth>
                    } />

                    {/* Catch all route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    )
}

export default App 