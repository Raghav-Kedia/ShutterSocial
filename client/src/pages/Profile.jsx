import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { postsApi } from '../services/api'
import PostCard from '../components/PostCard'
import CreatePostModal from '../components/CreatePostModal'
import { Edit, User, Calendar, Plus, Loader } from 'lucide-react'

const Profile = () => {
    const { user, updateProfile } = useAuth()
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState('')
    const [pagination, setPagination] = useState({})
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditProfile, setShowEditProfile] = useState(false)
    const [editingPost, setEditingPost] = useState(null)
    const [profileForm, setProfileForm] = useState({
        username: user?.username || '',
        bio: user?.bio || ''
    })
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

    const currentPage = 1

    useEffect(() => {
        if (user?.id) {
            fetchUserPosts()
        }
    }, [user?.id])

    const fetchUserPosts = async (page = 1, append = false) => {
        try {
            setLoading(!append)
            setLoadingMore(append)
            setError('')

            const response = await postsApi.getUserPosts(user.id, page, 10)
            const { posts: newPosts, pagination: newPagination } = response.data

            if (append) {
                setPosts(prev => [...prev, ...newPosts])
            } else {
                setPosts(newPosts)
            }
            setPagination(newPagination)
        } catch (error) {
            console.error('Error fetching user posts:', error)
            setError('Failed to load posts')
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    const loadMore = () => {
        if (pagination.hasNext && !loadingMore) {
            const nextPage = currentPage + 1
            fetchUserPosts(nextPage, true)
        }
    }

    const handleProfileUpdate = async (e) => {
        e.preventDefault()
        setIsUpdatingProfile(true)
        setError('')

        try {
            const result = await updateProfile(profileForm)
            if (result.success) {
                setShowEditProfile(false)
            } else {
                setError(result.message)
            }
        } catch (error) {
            setError('Failed to update profile')
        } finally {
            setIsUpdatingProfile(false)
        }
    }

    const handlePostCreated = (newPost) => {
        setPosts(prev => [newPost, ...prev])
        setShowCreateModal(false)
    }

    const handlePostUpdated = (updatedPost) => {
        setPosts(prev =>
            prev.map(post =>
                post._id === updatedPost._id ? updatedPost : post
            )
        )
        setEditingPost(null)
        setShowCreateModal(false)
    }

    const handlePostDeleted = (postId) => {
        setPosts(prev => prev.filter(post => post._id !== postId))
    }

    const handleEditPost = (post) => {
        setEditingPost(post)
        setShowCreateModal(true)
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <Loader className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <div className="card p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                            {user?.profilePicture ? (
                                <img
                                    src={user.profilePicture}
                                    alt={user.username}
                                    className="w-20 h-20 rounded-full object-cover"
                                />
                            ) : (
                                <User className="h-8 w-8 text-primary-600" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{user?.username}</h1>
                            <p className="text-gray-600 mt-1">
                                {user?.bio || 'No bio yet'}
                            </p>
                            <div className="flex items-center text-sm text-gray-500 mt-2">
                                <Calendar className="h-4 w-4 mr-1" />
                                Joined {formatDate(user?.createdAt)}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowEditProfile(true)}
                        className="btn-secondary flex items-center space-x-2"
                    >
                        <Edit className="h-4 w-4" />
                        <span>Edit Profile</span>
                    </button>
                </div>
            </div>

            {/* Posts Section */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                    My Posts ({pagination.totalPosts || 0})
                </h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>New Post</span>
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Posts */}
            <div className="space-y-6">
                {posts.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No posts yet
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Start sharing your photos with the community!
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary"
                        >
                            Create Your First Post
                        </button>
                    </div>
                ) : (
                    posts.map(post => (
                        <PostCard
                            key={post._id}
                            post={post}
                            onUpdate={handleEditPost}
                            onDelete={handlePostDeleted}
                        />
                    ))
                )}

                {/* Load More Button */}
                {pagination.hasNext && (
                    <div className="text-center">
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingMore ? (
                                <div className="flex items-center space-x-2">
                                    <Loader className="h-4 w-4 animate-spin" />
                                    <span>Loading...</span>
                                </div>
                            ) : (
                                'Load More'
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Edit Profile Modal */}
            {showEditProfile && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
                            <button
                                onClick={() => setShowEditProfile(false)}
                                disabled={isUpdatingProfile}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                <Edit className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={profileForm.username}
                                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                                    className="input"
                                    required
                                    minLength={3}
                                    maxLength={30}
                                />
                            </div>

                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                                    Bio
                                </label>
                                <textarea
                                    id="bio"
                                    value={profileForm.bio}
                                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                                    className="input resize-none h-12 px-2 py-1 text-sm"
                                    maxLength={500}
                                    placeholder="Tell us about yourself..."
                                />
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-gray-500">
                                        {profileForm.bio.length}/500 characters
                                    </span>
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditProfile(false)}
                                    disabled={isUpdatingProfile}
                                    className="flex-1 btn-secondary disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdatingProfile}
                                    className="flex-1 btn-primary disabled:opacity-50"
                                >
                                    {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create/Edit Post Modal */}
            {showCreateModal && (
                <CreatePostModal
                    post={editingPost}
                    onClose={() => {
                        setShowCreateModal(false)
                        setEditingPost(null)
                    }}
                    onPostCreated={handlePostCreated}
                    onPostUpdated={handlePostUpdated}
                />
            )}
        </div>
    )
}

export default Profile 