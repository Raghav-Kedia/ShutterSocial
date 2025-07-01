import { useState, useRef } from 'react'
import { postsApi } from '../services/api'
import { X, Upload, Image as ImageIcon } from 'lucide-react'

const CreatePostModal = ({ post, onClose, onPostCreated, onPostUpdated }) => {
    const [formData, setFormData] = useState({
        caption: post?.caption || ''
    })
    const [selectedFile, setSelectedFile] = useState(null)
    const [preview, setPreview] = useState(post?.image || null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const fileInputRef = useRef(null)
    const isEditing = !!post

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB')
                return
            }

            if (!file.type.startsWith('image/')) {
                setError('Please select an image file')
                return
            }

            setSelectedFile(file)
            setError('')

            const reader = new FileReader()
            reader.onload = (e) => setPreview(e.target.result)
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            if (isEditing) {
                // Update existing post
                const response = await postsApi.updatePost(post._id, {
                    caption: formData.caption
                })
                onPostUpdated(response.data.post)
            } else {
                // Create new post
                if (!selectedFile) {
                    setError('Please select an image')
                    setIsLoading(false)
                    return
                }

                const formDataToSend = new FormData()
                formDataToSend.append('image', selectedFile)
                formDataToSend.append('caption', formData.caption)

                const response = await postsApi.createPost(formDataToSend)
                onPostCreated(response.data.post)
            }
        } catch (error) {
            console.error('Error saving post:', error)
            setError(error.response?.data?.message || 'Failed to save post')
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        if (!isLoading) {
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {isEditing ? 'Edit Post' : 'Create New Post'}
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Image Upload */}
                    {!isEditing && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Image
                            </label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer"
                            >
                                {preview ? (
                                    <div className="space-y-2">
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="w-full h-48 object-cover rounded-lg mx-auto"
                                        />
                                        <p className="text-sm text-gray-600">
                                            Click to change image
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                                        <p className="text-sm text-gray-600">
                                            Click to upload an image
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            PNG, JPG up to 5MB
                                        </p>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Caption */}
                    <div>
                        <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
                            Caption
                        </label>
                        <textarea
                            id="caption"
                            value={formData.caption}
                            onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                            placeholder="What's on your mind?"
                            className="input resize-none h-12 px-2 py-1 text-sm"
                            maxLength={1000}
                            required
                        />
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500">
                                {formData.caption.length}/1000 characters
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1 btn-secondary disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || (!isEditing && !selectedFile)}
                            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Saving...' : (isEditing ? 'Update Post' : 'Create Post')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreatePostModal 