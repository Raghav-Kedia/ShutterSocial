import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { postsApi } from '../services/api'
import PostCard from '../components/PostCard'
import CreatePostModal from '../components/CreatePostModal'
import { Plus, Search, Loader } from 'lucide-react'

const Feed = () => {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState('')
    const [pagination, setPagination] = useState({})
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingPost, setEditingPost] = useState(null)

    const [searchParams, setSearchParams] = useSearchParams()
    const currentPage = parseInt(searchParams.get('page')) || 1
    const searchQuery = searchParams.get('search') || ''

    useEffect(() => {
        fetchPosts()
    }, [currentPage, searchQuery])

    const fetchPosts = async (page = currentPage, append = false) => {
        try {
            setLoading(!append)
            setLoadingMore(append)
            setError('')

            const response = await postsApi.getFeed(page, 10, searchQuery)
            const { posts: newPosts, pagination: newPagination } = response.data

            if (append) {
                setPosts(prev => [...prev, ...newPosts])
            } else {
                setPosts(newPosts)
            }
            setPagination(newPagination)
        } catch (error) {
            console.error('Error fetching posts:', error)
            setError('Failed to load posts')
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const search = formData.get('search')

        if (search.trim()) {
            setSearchParams({ search: search.trim(), page: '1' })
        } else {
            setSearchParams({ page: '1' })
        }
    }

    const loadMore = () => {
        if (pagination.hasNext && !loadingMore) {
            const nextPage = currentPage + 1
            setSearchParams({
                ...(searchQuery && { search: searchQuery }),
                page: nextPage.toString()
            })
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <Loader className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {searchQuery ? `Search: "${searchQuery}"` : 'ShutterSocial Feed'}
                    </h1>
                    {searchQuery && (
                        <p className="text-gray-600 mt-1">
                            {pagination.totalPosts} post{pagination.totalPosts !== 1 ? 's' : ''} found
                        </p>
                    )}
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>New Post</span>
                </button>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        name="search"
                        defaultValue={searchQuery}
                        placeholder="Search posts or users..."
                        className="input pl-10"
                    />
                </div>
            </form>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Posts */}
            <div className="space-y-6">
                {posts.length === 0 && !loading ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchQuery ? 'No posts found' : 'No posts yet'}
                        </h3>
                        <p className="text-gray-600">
                            {searchQuery
                                ? 'Try adjusting your search terms'
                                : 'Be the first to share a photo!'
                            }
                        </p>
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

                {/* End of Feed */}
                {!pagination.hasNext && posts.length > 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>You've reached the end of the feed</p>
                    </div>
                )}
            </div>

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

export default Feed 