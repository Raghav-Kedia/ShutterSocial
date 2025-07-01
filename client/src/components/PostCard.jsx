import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { postsApi } from '../services/api'
import { Heart, MessageCircle, MoreHorizontal, Edit, Trash2, Clock } from 'lucide-react'

const PostCard = ({ post, onUpdate, onDelete }) => {
    const { user } = useAuth()
    const [isLiked, setIsLiked] = useState(post.isLiked || false)
    const [likeCount, setLikeCount] = useState(post.likeCount || 0)
    const [isLoading, setIsLoading] = useState(false)
    const [showMenu, setShowMenu] = useState(false)

    const handleLike = async () => {
        if (isLoading) return

        setIsLoading(true)
        try {
            const response = await postsApi.toggleLike(post._id)
            setIsLiked(response.data.isLiked)
            setLikeCount(response.data.likeCount)
        } catch (error) {
            console.error('Error toggling like:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await postsApi.deletePost(post._id)
                onDelete(post._id)
            } catch (error) {
                console.error('Error deleting post:', error)
            }
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))

        if (diffInHours < 1) {
            return 'Just now'
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`
        } else {
            const diffInDays = Math.floor(diffInHours / 24)
            return `${diffInDays}d ago`
        }
    }

    const isOwnPost = user?.id === post.author._id

    return (
        <div className="post-card">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        {post.author.profilePicture ? (
                            <img
                                src={post.author.profilePicture}
                                alt={post.author.username}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <span className="text-primary-600 font-semibold">
                                {post.author.username.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div>
                        <Link
                            to={`/user/${post.author._id}`}
                            className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                        >
                            {post.author.username}
                        </Link>
                        <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(post.createdAt)}
                        </div>
                    </div>
                </div>

                {/* Post Menu */}
                {isOwnPost && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <MoreHorizontal className="h-5 w-5 text-gray-500" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                <button
                                    onClick={() => {
                                        onUpdate(post)
                                        setShowMenu(false)
                                    }}
                                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => {
                                        handleDelete()
                                        setShowMenu(false)
                                    }}
                                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Post Image */}
            <div className="mb-4">
                <img
                    src={post.image}
                    alt={post.caption}
                    className="w-full h-auto rounded-lg object-cover"
                />
            </div>

            {/* Post Caption */}
            <p className="text-gray-900 mb-4 leading-relaxed">
                {post.caption}
            </p>

            {/* Post Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleLike}
                        disabled={isLoading}
                        className={`flex items-center space-x-1 transition-colors ${isLiked
                            ? 'text-red-500'
                            : 'text-gray-500 hover:text-red-500'
                            }`}
                    >
                        <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="text-sm font-medium">{likeCount}</span>
                    </button>

                    <Link
                        to={`/post/${post._id}`}
                        className="flex items-center space-x-1 text-gray-500 hover:text-primary-600 transition-colors"
                    >
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">{post.commentCount || 0}</span>
                    </Link>
                </div>

                <Link
                    to={`/post/${post._id}`}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                    View Details
                </Link>
            </div>
        </div>
    )
}

export default PostCard 