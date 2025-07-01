import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { postsApi } from '../services/api'
import CommentBox from '../components/CommentBox'
import { ArrowLeft, Heart, MessageCircle, MoreHorizontal, Edit, Trash2, Clock, User } from 'lucide-react'

const PostDetail = () => {
    const { id } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()

    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [isLiked, setIsLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [showMenu, setShowMenu] = useState(false)

    useEffect(() => {
        fetchPost()
    }, [id])

    const fetchPost = async () => {
        try {
            setLoading(true)
            setError('')

            const response = await postsApi.getPost(id)
            const postData = response.data.post

            setPost(postData)
            setIsLiked(postData.isLiked || false)
            setLikeCount(postData.likeCount || 0)
        } catch (error) {
            console.error('Error fetching post:', error)
            setError('Post not found or you may not have permission to view it')
        } finally {
            setLoading(false)
        }
    }

    const handleLike = async () => {
        if (isLoading) return

        setIsLoading(true)
        try {
            const response = await postsApi.toggleLike(id)
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
                await postsApi.deletePost(id)
                navigate('/')
            } catch (error) {
                console.error('Error deleting post:', error)
            }
        }
    }

    const handleCommentAdded = (newComment) => {
        setPost(prev => ({
            ...prev,
            comments: [...prev.comments, newComment],
            commentCount: prev.commentCount + 1
        }))
    }

    const handleCommentDeleted = (commentId) => {
        setPost(prev => ({
            ...prev,
            comments: prev.comments.filter(comment => comment._id !== commentId),
            commentCount: prev.commentCount - 1
        }))
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

    const isOwnPost = user?.id === post?.author?._id

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    if (error || !post) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-600 text-2xl">!</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {error || 'Post not found'}
                </h3>
                <Link to="/" className="btn-primary">
                    Back to Feed
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <div>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                </button>
            </div>

            {/* Post */}
            <div className="card p-6">
                {/* Post Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                            {post.author.profilePicture ? (
                                <img
                                    src={post.author.profilePicture}
                                    alt={post.author.username}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <User className="h-6 w-6 text-primary-600" />
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
                                            navigate(`/edit-post/${post._id}`)
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
                <div className="flex items-center space-x-4 mb-6">
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

                    <div className="flex items-center space-x-1 text-gray-500">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">{post.commentCount || 0}</span>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Comments ({post.commentCount || 0})
                    </h3>
                    <CommentBox
                        postId={post._id}
                        comments={post.comments}
                        onCommentAdded={handleCommentAdded}
                        onCommentDeleted={handleCommentDeleted}
                    />
                </div>
            </div>
        </div>
    )
}

export default PostDetail 