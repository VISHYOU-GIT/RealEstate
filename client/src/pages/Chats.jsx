import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getChats, getMessages, sendMessage, setActiveChat, addMessage, updateChatLastMessage, clearUnreadCount } from '../redux/slices/chatSlice'
import Loader from '../components/Loader'
import ImageWithShimmer from '../components/ImageWithShimmer'
import { FaSearch, FaPaperPlane, FaUser, FaChevronUp, FaPaperclip, FaLink, FaImage, FaVideo, FaFilePdf, FaTimes, FaDownload, FaExpand } from 'react-icons/fa'
import { format } from 'date-fns'
import io from 'socket.io-client'
import toast from 'react-hot-toast'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
const MESSAGES_PER_PAGE = 10

// File size limits (in bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

function Chats() {
  const dispatch = useDispatch()
  const { chats, messages, activeChat, isLoading } = useSelector((state) => state.chat)
  const { user } = useSelector((state) => state.auth)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageText, setMessageText] = useState('')
  const [socket, setSocket] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState(null)
  const [displayedMessagesCount, setDisplayedMessagesCount] = useState(MESSAGES_PER_PAGE)
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [fullScreenMedia, setFullScreenMedia] = useState(null)
  const [showMediaModal, setShowMediaModal] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const typingIndicatorTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission)
      })
    }
  }, [])

  // Function to show browser notification
  const showNotification = (title, body, icon) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      // Check if page is not in focus
      if (document.hidden) {
        const notification = new Notification(title, {
          body,
          icon: icon || '/logo.png',
          badge: '/logo.png',
          tag: 'chat-message',
          requireInteraction: false,
          silent: false
        })

        notification.onclick = () => {
          window.focus()
          notification.close()
        }

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000)
      }
    }
  }

  // Compress image
  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Max dimensions
          const maxWidth = 1920
          const maxHeight = 1080

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width *= ratio
            height *= ratio
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }))
            },
            'image/jpeg',
            0.8 // 80% quality
          )
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  // Handle file selection
  const handleFileSelect = async (e, fileType) => {
    const file = e.target.files?.[0]
    if (!file) return

    setShowAttachMenu(false)

    // Validate file size
    if (fileType === 'image' && file.size > MAX_IMAGE_SIZE) {
      toast.error('Image size should be less than 5MB')
      return
    }
    if (fileType === 'video' && file.size > MAX_VIDEO_SIZE) {
      toast.error('Video size should be less than 50MB')
      return
    }
    if (fileType === 'pdf' && file.size > MAX_FILE_SIZE) {
      toast.error('PDF size should be less than 10MB')
      return
    }

    try {
      // Basic file security checks
      toast.loading('Scanning file for threats...')
      await performSecurityChecks(file)
      toast.dismiss()
      
      let processedFile = file

      // Compress images
      if (fileType === 'image' && file.type.startsWith('image/')) {
        toast.loading('Compressing image...')
        processedFile = await compressImage(file)
        toast.dismiss()
        toast.success('Image compressed successfully')
      }

      setSelectedFile({ file: processedFile, type: fileType })

      // Create preview
      if (fileType === 'image') {
        const reader = new FileReader()
        reader.onloadend = () => setFilePreview(reader.result)
        reader.readAsDataURL(processedFile)
      } else if (fileType === 'video') {
        const url = URL.createObjectURL(processedFile)
        setFilePreview(url)
      } else {
        setFilePreview(processedFile.name)
      }
    } catch (error) {
      toast.error(error.message || 'Error processing file')
      console.error(error)
    }
  }

  // Perform basic security checks on file
  const performSecurityChecks = async (file) => {
    return new Promise((resolve, reject) => {
      // Check file extension
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.js', '.vbs', '.jar', '.msi', '.app', '.deb', '.rpm']
      const fileName = file.name.toLowerCase()
      
      for (const ext of dangerousExtensions) {
        if (fileName.endsWith(ext)) {
          reject(new Error('File type not allowed for security reasons'))
          return
        }
      }

      // Check MIME type
      const allowedMimes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm',
        'application/pdf'
      ]
      
      if (!allowedMimes.includes(file.type)) {
        reject(new Error('File type not supported'))
        return
      }

      // Read file header to verify it matches the MIME type (basic magic number check)
      const reader = new FileReader()
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target.result).subarray(0, 4)
        let header = ''
        for (let i = 0; i < arr.length; i++) {
          header += arr[i].toString(16)
        }

        // Basic file signature validation
        const signatures = {
          'ffd8ffe0': 'image/jpeg',
          'ffd8ffe1': 'image/jpeg',
          'ffd8ffe2': 'image/jpeg',
          '89504e47': 'image/png',
          '47494638': 'image/gif',
          '25504446': 'application/pdf',
          '00000018': 'video/mp4',
          '00000020': 'video/mp4'
        }

        // Validate signature matches file type for images and PDFs
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          const matchesSignature = Object.keys(signatures).some(sig => header.startsWith(sig))
          if (!matchesSignature) {
            reject(new Error('File appears to be corrupted or not a valid file'))
            return
          }
        }

        resolve()
      }
      
      reader.onerror = () => reject(new Error('Error reading file'))
      reader.readAsArrayBuffer(file.slice(0, 4))
    })
  }

  // Handle link sending
  const handleSendLink = () => {
    const url = prompt('Enter URL:')
    if (url && isValidUrl(url)) {
      handleSendMessage(null, 'link', url)
    } else if (url) {
      toast.error('Please enter a valid URL')
    }
  }

  // Validate URL
  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  // Clear file selection
  const clearFileSelection = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token')
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      withCredentials: true
    })

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id)
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error)
      console.log('Trying to connect to:', SOCKET_URL)
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    newSocket.on('receive_message', (data) => {
      console.log('Received message via Socket.IO:', data)
      
      if (data.message) {
        // Only add message from other users to prevent duplicates
        const senderId = data.message?.sender?._id || data.message?.sender
        const currentUserId = user._id || user.id
        
        console.log('Sender ID:', senderId, 'Current User ID:', currentUserId)
        
        if (senderId && senderId !== currentUserId) {
          console.log('Adding message from other user')
          
          // Show notification for messages from other users
          const senderName = data.message?.sender?.name || 'Someone'
          const messageContent = data.message?.content || data.message?.message || 'New message'
          showNotification(
            `New message from ${senderName}`,
            messageContent,
            data.message?.sender?.profileImage
          )
          
          // Add message if it's for the active chat
          if (data.roomId === activeChat) {
            dispatch(addMessage(data.message))
          }
          
          // Update chat list with new message (this updates lastMessage and unread count)
          console.log('Updating chat last message:', {
            chatId: data.roomId,
            activeChat,
            isActiveChatOpen: data.roomId === activeChat,
            senderId,
            currentUserId
          })
          
          dispatch(updateChatLastMessage({
            chatId: data.roomId,
            message: data.message,
            currentUserId: currentUserId,
            isActiveChatOpen: data.roomId === activeChat
          }))
        }
      }
    })

    newSocket.on('user_typing', (data) => {
      console.log('User typing event received:', data)
      const currentUserId = user._id || user.id
      
      if (data.roomId === activeChat && data.userId !== currentUserId) {
        setIsTyping(true)
        setTypingUser(data.name)
        
        // Auto-hide typing indicator after 3 seconds
        if (typingIndicatorTimeoutRef.current) {
          clearTimeout(typingIndicatorTimeoutRef.current)
        }
        typingIndicatorTimeoutRef.current = setTimeout(() => {
          setIsTyping(false)
          setTypingUser(null)
        }, 3000)
      }
    })

    newSocket.on('user_stop_typing', (data) => {
      console.log('User stop typing event received:', data)
      
      if (data?.roomId === activeChat || !data?.roomId) {
        setIsTyping(false)
        setTypingUser(null)
        if (typingIndicatorTimeoutRef.current) {
          clearTimeout(typingIndicatorTimeoutRef.current)
        }
      }
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current)
      }
    }
  }, [activeChat, dispatch, user])

  // Fetch chats on mount
  useEffect(() => {
    dispatch(getChats())
  }, [dispatch])

  // Fetch messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      dispatch(getMessages(activeChat)).then(() => {
        // Clear unread count for this chat (backend marks as read)
        dispatch(clearUnreadCount(activeChat))
      })
      setDisplayedMessagesCount(MESSAGES_PER_PAGE) // Reset to show latest 10
      if (socket) {
        socket.emit('join_room', activeChat)
      }
    }
  }, [activeChat, dispatch, socket])

  // Scroll to bottom when messages change or new message arrives
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [messages.length])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showMediaModal) {
        setShowMediaModal(false)
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showMediaModal])

  const handleSelectChat = (chatId) => {
    dispatch(setActiveChat(chatId))
  }

  const handleSendMessage = async (e, messageType = 'text', linkUrl = null) => {
    if (e) e.preventDefault()
    
    if (!activeChat) return
    
    // Check if there's text or file to send
    if (!messageText.trim() && !selectedFile && !linkUrl) return

    const messageContent = messageText
    const fileData = selectedFile
    
    setMessageText('')
    setIsUploading(true)

    try {
      let messageData = {
        chatId: activeChat,
        content: messageContent || (linkUrl ? linkUrl : ''),
        type: messageType
      }

      // If there's a file, convert to base64 and upload to Cloudinary via backend
      if (fileData) {
        setUploadProgress(0)
        toast.loading('Preparing upload...')
        
        // Simulate upload progress while converting to base64
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90))
        }, 200)
        
        const base64 = await fileToBase64(fileData.file)
        
        clearInterval(progressInterval)
        setUploadProgress(95)
        
        messageData.fileUrl = base64
        messageData.fileName = fileData.file.name
        messageData.fileSize = fileData.file.size
        messageData.type = fileData.type
        messageData.content = messageContent || `Shared ${fileData.type}`
        toast.dismiss()
      }

      // Send message via Redux - this will upload to Cloudinary
      setUploadProgress(98)
      const result = await dispatch(sendMessage(messageData)).unwrap()
      
      setUploadProgress(100)
      
      // Add the message locally for immediate display
      if (result) {
        dispatch(addMessage(result))
        toast.success('Message sent!')
        
        // Update chat list to update last message (without full refresh)
        dispatch(updateChatLastMessage({
          chatId: activeChat,
          message: result,
          currentUserId: user._id || user.id,
          isActiveChatOpen: true // This is our own message in active chat
        }))
      }

      // Clear file selection
      clearFileSelection()
      setUploadProgress(0)

      if (socket) {
        socket.emit('stop_typing', { roomId: activeChat })
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.dismiss()
      toast.error(error.message || 'Failed to send message')
      setUploadProgress(0)
      // Restore message text on error
      setMessageText(messageContent)
      // Restore file selection on error
      if (fileData) {
        setSelectedFile(fileData)
      }
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleTyping = (e) => {
    setMessageText(e.target.value)

    if (!socket || !activeChat) return

    // Emit typing event
    socket.emit('typing', {
      roomId: activeChat,
      userId: user._id || user.id,
      name: user.name
    })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { roomId: activeChat })
    }, 1000)
  }

  const filteredChats = chats.filter((chat) => {
    const otherParticipant = chat.participants?.find(
      (p) => p._id !== user.id && p._id !== user._id
    )
    const propertyTitle = chat.property?.title || ''
    const participantName = otherParticipant?.name || ''

    return (
      propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      participantName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const getOtherParticipant = (chat) => {
    return chat.participants?.find(
      (p) => p._id !== user.id && p._id !== user._id
    )
  }

  // Get initials from name for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?'
    const words = name.trim().split(' ')
    if (words.length === 1) return words[0][0].toUpperCase()
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }

  const handleLoadMore = () => {
    const currentScrollHeight = messagesContainerRef.current?.scrollHeight
    setDisplayedMessagesCount(prev => prev + MESSAGES_PER_PAGE)
    
    // Maintain scroll position after loading more
    setTimeout(() => {
      if (messagesContainerRef.current) {
        const newScrollHeight = messagesContainerRef.current.scrollHeight
        messagesContainerRef.current.scrollTop = newScrollHeight - currentScrollHeight
      }
    }, 100)
  }

  // Get messages to display (latest X messages)
  const displayedMessages = messages.slice(-displayedMessagesCount)
  const hasMoreMessages = messages.length > displayedMessagesCount

  if (isLoading && chats.length === 0) return <Loader />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 180px)', maxHeight: '800px' }}>
          {/* Chat List Sidebar */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-4 flex flex-col overflow-hidden" style={{ height: '100%' }}>
            <div className="mb-4 flex-shrink-0">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredChats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Start a conversation from a property page</p>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const otherParticipant = getOtherParticipant(chat)
                  const isActive = activeChat === chat._id
                  const unreadCount = chat.unreadCount || 0
                  
                  // Get last message display text
                  const getLastMessageText = () => {
                    if (!chat.lastMessage) return 'No messages yet'
                    
                    const lastMsg = chat.lastMessage
                    const isOwnMessage = lastMsg.sender?._id === user.id || lastMsg.sender?._id === user._id || lastMsg.sender === user.id || lastMsg.sender === user._id
                    const prefix = isOwnMessage ? 'You: ' : ''
                    
                    if (lastMsg.type === 'image') return `${prefix}📷 Photo`
                    if (lastMsg.type === 'video') return `${prefix}🎥 Video`
                    if (lastMsg.type === 'pdf') return `${prefix}📄 PDF`
                    if (lastMsg.type === 'link') return `${prefix}🔗 Link`
                    
                    return `${prefix}${lastMsg.content || 'Message'}`
                  }

                  return (
                    <div
                      key={chat._id}
                      onClick={() => handleSelectChat(chat._id)}
                      className={`p-4 rounded-lg cursor-pointer transition-colors relative ${
                        isActive
                          ? 'bg-primary-100 border-2 border-primary-600'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0 relative">
                          {otherParticipant?.profileImage && otherParticipant.profileImage !== 'https://via.placeholder.com/150' ? (
                            <img
                              src={otherParticipant.profileImage}
                              alt={otherParticipant.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-lg font-bold">
                              {getInitials(otherParticipant?.name || 'U')}
                            </div>
                          )}
                          {unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-sm truncate">
                              {otherParticipant?.name || 'Unknown User'}
                            </h3>
                            {chat.lastMessageAt && (
                              <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                {format(new Date(chat.lastMessageAt), 'MMM dd')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {chat.property?.title || 'Property'}
                          </p>
                          <p className={`text-xs mt-1 truncate ${unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                            {getLastMessageText()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4 flex flex-col overflow-hidden" style={{ height: '100%' }}>
            {activeChat ? (
              <>
                {/* Chat Header */}
                <div className="pb-3 border-b mb-3 flex-shrink-0">
                  {(() => {
                    const currentChat = chats.find(c => c._id === activeChat)
                    const otherParticipant = currentChat ? getOtherParticipant(currentChat) : null
                    
                    return (
                      <div className="flex items-center space-x-3">
                        {otherParticipant?.profileImage && otherParticipant.profileImage !== 'https://via.placeholder.com/150' ? (
                          <img
                            src={otherParticipant.profileImage}
                            alt={otherParticipant.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl font-bold">
                            {getInitials(otherParticipant?.name || 'U')}
                          </div>
                        )}
                        <div>
                          <h2 className="font-semibold text-lg">
                            {otherParticipant?.name || 'Unknown User'}
                          </h2>
                          <p className="text-sm text-gray-600">
                            {currentChat?.property?.title || 'Property'}
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Messages */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto mb-3 px-2" 
                  style={{ minHeight: 0, maxHeight: '100%', paddingBottom: '40px' }}
                >
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No messages yet</p>
                      <p className="text-sm mt-2">Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Load More Button */}
                      {hasMoreMessages && (
                        <div className="text-center py-2">
                          <button
                            onClick={handleLoadMore}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center mx-auto gap-2 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
                          >
                            <FaChevronUp className="text-xs" />
                            Load Previous Messages
                          </button>
                        </div>
                      )}
                      
                      {/* Display Messages */}
                      {displayedMessages.map((message) => {
                        const isOwn = message.sender._id === user.id || message.sender._id === user._id
                        const messageType = message.type || 'text'

                        return (
                          <div
                            key={message._id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                isOwn
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-gray-200 text-gray-800'
                              }`}
                            >
                              {!isOwn && (
                                <p className="text-xs font-semibold mb-1">
                                  {message.sender.name}
                                </p>
                              )}
                              
                              {/* Render based on message type */}
                              {messageType === 'image' && message.fileUrl && (
                                <div className="mb-2 cursor-pointer group relative" onClick={() => {
                                  setFullScreenMedia({ type: 'image', url: message.fileUrl, name: message.fileName })
                                  setShowMediaModal(true)
                                }}>
                                  <ImageWithShimmer 
                                    src={message.fileUrl} 
                                    alt="Shared image" 
                                    className="max-w-full h-auto rounded hover:opacity-90 transition-opacity"
                                    style={{ maxHeight: '200px', maxWidth: '300px', objectFit: 'cover' }}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                                    <FaSearch className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl" />
                                  </div>
                                </div>
                              )}
                              
                              {messageType === 'video' && message.fileUrl && (
                                <div 
                                  className="mb-2 cursor-pointer group relative overflow-hidden rounded" 
                                  onClick={() => {
                                    setFullScreenMedia({ type: 'video', url: message.fileUrl, name: message.fileName })
                                    setShowMediaModal(true)
                                  }}
                                  style={{ maxHeight: '200px', maxWidth: '300px' }}
                                >
                                  <video 
                                    className="w-full h-full object-cover"
                                    style={{ maxHeight: '200px', maxWidth: '300px' }}
                                    preload="metadata"
                                  >
                                    <source src={`${message.fileUrl}#t=0.1`} />
                                  </video>
                                  <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all flex items-center justify-center">
                                    <div className="bg-white bg-opacity-90 rounded-full p-4 group-hover:scale-110 transition-transform">
                                      <FaVideo className="text-primary-600 text-2xl" />
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {messageType === 'pdf' && message.fileUrl && (
                                <div className="mb-2">
                                  <button
                                    onClick={() => {
                                      setFullScreenMedia({ type: 'pdf', url: message.fileUrl, name: message.fileName || 'Document.pdf' })
                                      setShowMediaModal(true)
                                    }}
                                    className={`flex items-center gap-2 p-3 rounded w-full ${
                                      isOwn ? 'bg-primary-700 hover:bg-primary-800' : 'bg-gray-300 hover:bg-gray-400'
                                    } transition-colors`}
                                  >
                                    <FaFilePdf className="text-2xl text-red-500" />
                                    <div className="flex-1 text-left">
                                      <span className="text-sm font-medium block">{message.fileName || 'Document.pdf'}</span>
                                      {message.fileSize && (
                                        <span className="text-xs opacity-75">
                                          {(message.fileSize / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                      )}
                                    </div>
                                    <FaSearch className="text-lg" />
                                  </button>
                                </div>
                              )}
                              
                              {messageType === 'link' && (
                                <div className="mb-2">
                                  <a 
                                    href={message.content} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 underline hover:opacity-80`}
                                  >
                                    <FaLink />
                                    <span className="text-sm break-all">{message.content}</span>
                                  </a>
                                </div>
                              )}
                              
                              {(messageType === 'text' || !messageType) && (
                                <p className="break-words">{message.content || message.message}</p>
                              )}
                              
                              {message.content && messageType !== 'text' && messageType !== 'link' && (
                                <p className="break-words text-sm mt-1">{message.content}</p>
                              )}
                              
                              <p
                                className={`text-xs mt-1 ${
                                  isOwn ? 'text-primary-100' : 'text-gray-500'
                                }`}
                              >
                                {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                      
                      {/* Typing Indicator */}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-gray-200 text-gray-600 rounded-lg p-3 text-sm italic">
                            {typingUser} is typing...
                          </div>
                        </div>
                      )}
                      
                      {/* Scroll Anchor */}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input - Always visible at bottom */}
                <div className="flex-shrink-0 border-t pt-3 bg-white">
                  {/* File Preview */}
                  {selectedFile && (
                    <div className="mb-3 p-3 bg-gray-100 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {selectedFile.type === 'image' && filePreview && (
                            <ImageWithShimmer src={filePreview} alt="Preview" className="w-20 h-20 object-cover rounded" />
                          )}
                          {selectedFile.type === 'video' && filePreview && (
                            <video src={filePreview} className="w-20 h-20 object-cover rounded" />
                          )}
                          {selectedFile.type === 'pdf' && (
                            <div className="flex items-center gap-2">
                              <FaFilePdf className="text-3xl text-red-500" />
                              <span className="text-sm">{filePreview}</span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={clearFileSelection}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTimes className="text-xl" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload Progress Bar */}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mb-3 px-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading file...
                        </span>
                        <span className="text-sm font-bold text-primary">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div
                          className="bg-gradient-to-r from-primary via-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                          style={{ width: `${uploadProgress}%` }}
                        >
                          {/* Animated shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {uploadProgress < 30 && "Scanning file for threats..."}
                        {uploadProgress >= 30 && uploadProgress < 70 && "Processing file..."}
                        {uploadProgress >= 70 && uploadProgress < 95 && "Uploading to cloud..."}
                        {uploadProgress >= 95 && "Finalizing..."}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    {/* Attachment Button with Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        className="btn btn-outline px-3 py-2 flex items-center justify-center"
                        title="Attach file"
                      >
                        <FaPaperclip className="text-lg" />
                      </button>
                      
                      {/* Attachment Menu */}
                      {showAttachMenu && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white border rounded-lg shadow-lg p-2 min-w-[180px] z-10">
                          <button
                            type="button"
                            onClick={handleSendLink}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded text-left"
                          >
                            <FaLink className="text-blue-500" />
                            <span>Send Link</span>
                          </button>
                          
                          <label className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">
                            <FaImage className="text-green-500" />
                            <span>Image</span>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileSelect(e, 'image')}
                              className="hidden"
                            />
                          </label>
                          
                          <label className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">
                            <FaVideo className="text-purple-500" />
                            <span>Video</span>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => handleFileSelect(e, 'video')}
                              className="hidden"
                            />
                          </label>
                          
                          <label className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">
                            <FaFilePdf className="text-red-500" />
                            <span>PDF</span>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => handleFileSelect(e, 'pdf')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    
                    <form onSubmit={handleSendMessage} className="flex-1 flex space-x-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={handleTyping}
                        placeholder="Type a message..."
                        className="input flex-1"
                        autoComplete="off"
                      />
                      <button
                        type="submit"
                        disabled={(!messageText.trim() && !selectedFile) || isUploading}
                        className="btn btn-primary px-6 flex items-center justify-center flex-shrink-0"
                        style={{ minWidth: '60px' }}
                      >
                        {isUploading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          <FaPaperPlane />
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FaPaperPlane className="text-5xl mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Media Modal */}
      {showMediaModal && fullScreenMedia && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
          onClick={() => setShowMediaModal(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setShowMediaModal(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            title="Close (ESC)"
          >
            <FaTimes className="text-3xl" />
          </button>

          {/* Download Button */}
          <a
            href={fullScreenMedia.url}
            download={fullScreenMedia.name}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 left-4 text-white hover:text-gray-300 transition-colors z-10 flex items-center gap-2 bg-black bg-opacity-50 px-4 py-2 rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <FaDownload className="text-xl" />
            <span className="hidden sm:inline">Download</span>
          </a>

          {/* File Name */}
          {fullScreenMedia.name && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-lg max-w-md truncate">
              {fullScreenMedia.name}
            </div>
          )}

          {/* Media Content */}
          <div 
            className="max-w-7xl max-h-full w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {fullScreenMedia.type === 'image' && (
              <ImageWithShimmer
                src={fullScreenMedia.url}
                alt={fullScreenMedia.name || 'Full screen image'}
                className="max-w-full max-h-full object-contain rounded"
              />
            )}

            {fullScreenMedia.type === 'video' && (
              <video
                controls
                autoPlay
                className="max-w-full max-h-full rounded"
                style={{ maxHeight: '90vh' }}
              >
                <source src={fullScreenMedia.url} />
                Your browser does not support video playback.
              </video>
            )}

            {fullScreenMedia.type === 'pdf' && (
              <div className="w-full h-full flex flex-col bg-gray-100 rounded-lg overflow-hidden">
                <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
                  <span className="text-gray-700 font-medium">{fullScreenMedia.name || 'PDF Document'}</span>
                  <a
                    href={fullScreenMedia.url}
                    download={fullScreenMedia.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaDownload />
                    Download
                  </a>
                </div>
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(fullScreenMedia.url)}&embedded=true`}
                  className="w-full flex-1"
                  title={fullScreenMedia.name || 'PDF Document'}
                  style={{ minHeight: '85vh', border: 'none' }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Chats
