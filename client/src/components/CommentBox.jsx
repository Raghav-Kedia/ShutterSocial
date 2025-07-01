import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { postsApi } from '../services/api'
import { Send, Trash2, Clock } from 'lucide-react'

const CommentBox = ({ postId, comments, onCommentAdded, onCommentDeleted }) => {
    const { user } = useAuth()
    const [newComment, setNewComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newComment.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            const response = await postsApi.addComment(postId, newComment.trim())
            onCommentAdded(response.data.comment)
            setNewComment('')
        } catch (error) {
            console.error('Error adding comment:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteComment = async (commentId) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            try {
                await postsApi.deleteComment(postId, commentId)
                onCommentDeleted(commentId)
            } catch (error) {
                console.error('Error deleting comment:', error)
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

    return (
        <div className="space-y-4">
            {/* Add Comment Form */}
            <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 input"
                    disabled={isSubmitting}
                />
                <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmitting}
                    className="btn-primary flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Post</span>
                </button>
            </form>

            {/* Comments List */}
            <div className="space-y-3">
                {comments?.map((comment) => (
                    <div key={comment._id} className="flex space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {comment.user.profilePicture ? (
                                <img
                                    src={comment.user.profilePicture}
                                    alt={comment.user.username}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            ) : (
                                <span className="text-primary-600 font-semibold text-sm">
                                    {comment.user.username.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-sm text-gray-900">
                                        {comment.user.username}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <div className="flex items-center text-xs text-gray-500">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {formatDate(comment.createdAt)}
                                        </div>

                                        {user?.id === comment.user._id && (
                                            <button
                                                onClick={() => handleDeleteComment(comment._id)}
                                                className="text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-gray-800 text-sm leading-relaxed">
                                    {comment.content}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {comments?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>No comments yet. Be the first to comment!</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CommentBox 