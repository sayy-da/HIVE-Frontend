import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  getEmployees,
  getConversations,
  getOrCreateConversation,
  sendMessage,
  getMessages,
  markAsRead,
  Employee,
  Conversation,
  Message,
} from "../../API/chat.api";
import {
  Send,
  Phone,
  Video,
  Search,
  MessageCircle,
  Settings,
  X,
  Mic,
  MicOff,
  VideoOff,
  UserPlus,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatService, WebRTCSignalPayload } from "../../services/ChatService";

export default function ChatPage() {
  const navigate = useNavigate();
  const employee = useSelector((state: RootState) => state.employee);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const employeesRef = useRef<Employee[]>([]);
  const conversationsRef = useRef<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatService, setChatService] = useState<ChatService | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState<"video" | "audio" | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null); // For audio-only calls
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [inCallConversationId, setInCallConversationId] = useState<string | null>(
    null
  );
  // Track if current user initiated the call (currently not used in UI)
  const [/* isCaller */, setIsCaller] = useState(false);
  // Incoming call state
  const [incomingCall, setIncomingCall] = useState<{
    conversationId: string;
    sdp: any;
    callType: "video" | "audio";
    callerName: string;
    isGroupInvite?: boolean; // Indicates if this is a group call invite
    fromUserId?: string; // ID of the person who sent the invite (for group calls)
  } | null>(null);
  // Group call state
  const [callParticipants, setCallParticipants] = useState<Map<string, {
    employee: Employee;
    peerConnection: RTCPeerConnection;
    stream: MediaStream | null;
    videoElement: HTMLVideoElement | HTMLAudioElement | null;
    connectionState: string;
    iceConnectionState: string;
  }>>(new Map());
  const callParticipantsRef = useRef<Map<string, {
    employee: Employee;
    peerConnection: RTCPeerConnection;
    stream: MediaStream | null;
    videoElement: HTMLVideoElement | HTMLAudioElement | null;
    connectionState: string;
    iceConnectionState: string;
  }>>(new Map());
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = useState("");
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const remoteVideoElementsRef = useRef<Map<string, HTMLVideoElement | HTMLAudioElement>>(new Map());
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map()); // For audio-only calls with multiple participants

  // Initialize Colyseus chat connection
  useEffect(() => {
    if (!employee.accessToken || !employee._id || !employee.companyId) return;

    const service = new ChatService();
    
    service.connect(employee.accessToken, employee._id, employee.companyId)
      .then(() => {
        console.log('[ChatPage] Connected to chat room');
        setChatService(service);

        // Set up message handlers
        service.onMessage((message: Message) => {
          console.log('[ChatPage] Received new message via WebSocket:', message);
          
          // Use functional update to access current selectedConversation
          setSelectedConversation((currentConv) => {
            // Normalize conversation IDs for comparison (handle string vs ObjectId)
            const currentConvId = currentConv?._id?.toString();
            const messageConvId = message.conversationId?.toString();
            
            // Only add message if it's for the currently selected conversation
            if (currentConvId && messageConvId && currentConvId === messageConvId) {
              setMessages((prev) => {
                // Remove optimistic message if it exists (replace with real message)
                const filtered = prev.filter(m => 
                  !m._id.startsWith('temp-') || 
                  (m.content !== message.content || m.senderId._id !== message.senderId._id)
                );
                
                // Check if message already exists (avoid duplicates)
                const exists = filtered.some(m => 
                  m._id === message._id || 
                  (m.content === message.content && 
                   m.senderId._id === message.senderId._id &&
                   Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 2000)
                );
                
                if (exists) {
                  console.log('[ChatPage] Message already exists, skipping:', message._id);
                  return filtered;
                }
                
                console.log('[ChatPage] Adding new message to state for selected conversation');
                return [...filtered, message];
              });
              markAsRead(message.conversationId);
            } else {
              console.log('[ChatPage] Message is for different conversation, not adding to display', {
                currentConvId,
                messageConvId,
                match: currentConvId === messageConvId
              });
            }
            return currentConv; // Don't change the conversation
          });
        });

        service.onConversationUpdate((conversation: Conversation) => {
          setConversations((prev) => {
            const existing = prev.find((c) => c._id === conversation._id);
            const updated = existing
              ? prev.map((c) => (c._id === conversation._id ? conversation : c))
              : [conversation, ...prev];
            // Update ref for synchronous access
            conversationsRef.current = updated;
            return updated;
          });
        });

        service.onTyping((data: { userId: string; conversationId: string; isTyping: boolean }) => {
          setSelectedConversation((currentConv) => {
            if (data.userId !== employee._id && data.conversationId === currentConv?._id) {
              setTypingUser(data.isTyping ? data.userId : null);
            }
            return currentConv;
          });
        });

        // WebRTC signaling handler
        service.onWebRTCSignal(async (signal: WebRTCSignalPayload) => {
          console.log(`[ChatPage] 📥 Received WebRTC signal:`, {
            type: signal.type,
            conversationId: signal.conversationId,
            callType: signal.callType,
            fromUserId: signal.fromUserId,
            targetUserId: signal.targetUserId,
            hasSdp: !!signal.sdp,
            hasCandidate: !!signal.candidate
          });
          const { type, conversationId, sdp, candidate, callType } = signal;

          // Use the service instance directly instead of chatService state
          if (!service) {
            console.warn("[ChatPage] No chatService available for WebRTC signal");
            return;
          }

          // For incoming calls (offers), we should handle them even if conversation isn't selected
          // For other signals, only handle if it's for the current call
          // Use functional updates to access current state
          setInCallConversationId((currentCallId) => {
            if (type !== "offer" && currentCallId && currentCallId !== conversationId) {
              console.log("[ChatPage] Signal is for a different conversation, ignoring");
              return currentCallId;
            }
            return currentCallId;
          });

          setIsInCall((currentlyInCall) => {
            switch (type) {
              case "offer":
                // Incoming call - check if we're already in a call
                if (currentlyInCall) {
                  console.log("[ChatPage] Already in a call, rejecting incoming call");
                  // Send rejection signal
                  service.sendWebRTCSignal({
                    conversationId,
                    type: "end",
                  });
                  return currentlyInCall;
                }
                // Find the conversation and caller info
                setConversations((prevConvs) => {
                  const conv = prevConvs.find(c => c._id === conversationId);
                  if (conv) {
                    const other = getOtherParticipant(conv);
                    if (other) {
                      // Store incoming call info for accept/reject UI
                      setIncomingCall({
                        conversationId,
                        sdp,
                        callType: (callType || "video") as "video" | "audio",
                        callerName: other.name,
                      });
                      // Optionally select the conversation
                      setSelectedConversation(conv);
                      setSelectedEmployee(other);
                    }
                  }
                  return prevConvs;
                });
                // Don't auto-accept - wait for user to accept/reject
                return currentlyInCall;
              case "answer":
                // Remote accepted our call
                // Check if this is from a specific participant (group call)
                // Use ref to get latest value to avoid stale closure
                console.log(`[ChatPage] 📥 ANSWER SIGNAL RECEIVED!`);
                console.log(`[ChatPage] Answer signal details:`, {
                  fromUserId: signal.fromUserId,
                  targetUserId: signal.targetUserId,
                  conversationId: signal.conversationId,
                  callType: signal.callType,
                  hasSdp: !!signal.sdp,
                  sdpType: signal.sdp?.type,
                  callParticipantsSize: callParticipantsRef.current.size,
                  hasParticipant: signal.fromUserId ? callParticipantsRef.current.has(signal.fromUserId) : false,
                  isInCall: currentlyInCall,
                  hasMainPeerConnection: !!peerConnectionRef.current
                });
                console.log(`[ChatPage] Current callParticipants:`, Array.from(callParticipantsRef.current.keys()));
                
                // If we have callParticipants, this might be a group call
                if (signal.fromUserId && callParticipantsRef.current.size > 0) {
                  // Check if participant exists in map
                  if (callParticipantsRef.current.has(signal.fromUserId)) {
                    console.log(`[ChatPage] Received answer from participant ${signal.fromUserId}`);
                    const participant = callParticipantsRef.current.get(signal.fromUserId);
                    console.log(`[ChatPage] Participant found:`, participant ? participant.employee.name : 'not found');
                    if (participant && participant.peerConnection) {
                      handleParticipantAnswer(signal.fromUserId, sdp);
                    } else {
                      console.warn(`[ChatPage] Participant found but no peer connection, trying to handle as regular answer`);
                      handleAnswer(sdp);
                    }
                  } else {
                    // Participant not in map yet - might be a timing issue
                    // Try to find them in employees and add them, or handle as regular answer
                    console.warn(`[ChatPage] Answer from ${signal.fromUserId} but participant not in map. CallParticipants:`, Array.from(callParticipantsRef.current.keys()));
                    // If we're in a call and have a main peer connection, this might be for the main connection
                    if (peerConnectionRef.current && callParticipantsRef.current.size === 0) {
                      console.log(`[ChatPage] Handling as regular 1-on-1 call answer (no participants in map)`);
                      handleAnswer(sdp);
                    } else {
                      // This is likely a group call answer that arrived before participant was added
                      // Try to handle it anyway - the participant should be added soon
                      console.warn(`[ChatPage] Answer received but participant ${signal.fromUserId} not found. This might be a timing issue.`);
                      // Wait a bit and try again, or handle as regular answer
                      if (signal.fromUserId) {
                        const fromUserId = signal.fromUserId; // Capture for closure
                        setTimeout(() => {
                          const participant = callParticipantsRef.current.get(fromUserId);
                          if (participant && participant.peerConnection) {
                            console.log(`[ChatPage] Participant found after delay, handling answer`);
                            handleParticipantAnswer(fromUserId, sdp);
                          } else {
                            console.warn(`[ChatPage] Participant still not found after delay, handling as regular answer`);
                            handleAnswer(sdp);
                          }
                        }, 100);
                      } else {
                        handleAnswer(sdp);
                      }
                    }
                  }
                } else {
                  // Regular 1-on-1 call answer
                  console.log(`[ChatPage] Handling as regular 1-on-1 call answer`);
                  handleAnswer(sdp);
                }
                return currentlyInCall;
              case "candidate":
                // Check if this is from a specific participant (group call)
                // Use ref to get latest value to avoid stale closure
                console.log(`[ChatPage] Received candidate signal, fromUserId: ${signal.fromUserId}, has participant: ${signal.fromUserId ? callParticipantsRef.current.has(signal.fromUserId) : false}, callParticipants size: ${callParticipantsRef.current.size}`);
                
                if (signal.fromUserId && callParticipantsRef.current.size > 0) {
                  // Check if participant exists in map
                  if (callParticipantsRef.current.has(signal.fromUserId)) {
                    console.log(`[ChatPage] Received candidate from participant ${signal.fromUserId}`);
                    handleParticipantCandidate(signal.fromUserId, candidate);
                  } else {
                    // Participant not in map yet - might be a timing issue
                    console.warn(`[ChatPage] Candidate from ${signal.fromUserId} but participant not in map. CallParticipants:`, Array.from(callParticipantsRef.current.keys()));
                    // Store candidate temporarily and try again later
                    if (signal.fromUserId) {
                      const fromUserId = signal.fromUserId;
                      setTimeout(() => {
                        const participant = callParticipantsRef.current.get(fromUserId);
                        if (participant && participant.peerConnection) {
                          console.log(`[ChatPage] Participant found after delay, handling candidate`);
                          handleParticipantCandidate(fromUserId, candidate);
                        } else {
                          console.warn(`[ChatPage] Participant still not found after delay, candidate may be lost`);
                        }
                      }, 200);
                    }
                  }
                } else {
                  // Regular 1-on-1 call candidate
                  console.log(`[ChatPage] Handling as regular 1-on-1 call candidate`);
                  handleRemoteCandidate(candidate);
                }
                return currentlyInCall;
              case "invite":
                // Handle group call invite
                if (!currentlyInCall) {
                  // This is a new group call invite
                  console.log("[ChatPage] Received group call invite from", signal.fromUserId);
                  
                  // Use functional updates to find inviter name synchronously
                  let inviterName = "Someone";
                  
                  setEmployees((prevEmployees) => {
                    const inviter = prevEmployees.find(emp => emp._id === signal.fromUserId);
                    if (inviter) {
                      inviterName = inviter.name;
                      console.log("[ChatPage] Found inviter from employees:", inviterName);
                    }
                    return prevEmployees;
                  });
                  
                  // Also check in conversations
                  setConversations((prevConvs) => {
                    const conv = prevConvs.find(c => c._id === conversationId);
                    if (conv) {
                      // Try to find inviter in conversation participants
                      const inviter = conv.participants.find((p: Employee) => p._id === signal.fromUserId);
                      if (inviter && inviterName === "Someone") {
                        inviterName = inviter.name;
                        console.log("[ChatPage] Found inviter from conversation:", inviterName);
                      }
                      
                      // Set selected conversation if found
                      setSelectedConversation(conv);
                      const other = getOtherParticipant(conv);
                      if (other) {
                        setSelectedEmployee(other);
                      }
                    }
                    return prevConvs;
                  });
                  
                  // Use setTimeout to ensure state updates are processed, then set incoming call
                  setTimeout(() => {
                    // Re-check for inviter name after state updates
                    setEmployees((prevEmployees) => {
                      const inviter = prevEmployees.find(emp => emp._id === signal.fromUserId);
                      const finalInviterName = inviter ? inviter.name : inviterName;
                      
                      // Show incoming call notification for group call invite
                      setIncomingCall({
                        conversationId,
                        sdp: sdp,
                        callType: (callType || "video") as "video" | "audio",
                        callerName: finalInviterName,
                        isGroupInvite: true, // Mark as group call invite
                        fromUserId: signal.fromUserId, // Store inviter's ID
                      });
                      
                      console.log("[ChatPage] Group call invite notification shown for", finalInviterName);
                      return prevEmployees;
                    });
                  }, 0);
                } else {
                  // Already in a call, handle as new participant joining
                  console.log("[ChatPage] New participant joining group call");
                  // When we're already in a call and receive an invite, it means someone new is joining
                  // We need to create a peer connection with this new participant
                  if (signal.fromUserId && chatService && isInCall) {
                    // Find the employee who is joining
                    setEmployees((prevEmployees) => {
                      const newParticipant = prevEmployees.find(emp => emp._id === signal.fromUserId);
                      if (newParticipant) {
                        console.log(`[ChatPage] New participant ${newParticipant.name} is joining, creating connection...`);
                        // Check if we already have this participant
                        if (!callParticipants.has(newParticipant._id)) {
                          // Add this participant to the call
                          setTimeout(() => {
                            addParticipantToCall(newParticipant);
                          }, 500); // Small delay to ensure their connection is ready
                        } else {
                          console.log(`[ChatPage] Participant ${newParticipant.name} already in call`);
                        }
                      } else {
                        console.warn(`[ChatPage] Could not find employee for new participant ${signal.fromUserId}`);
                      }
                      return prevEmployees;
                    });
                  }
                }
                return currentlyInCall;
              case "participant_joined":
                // Someone new joined the call - add them to our participant list
                if (currentlyInCall && signal.participantId && signal.participantId !== employee._id) {
                  console.log(`[ChatPage] 📢 Participant ${signal.participantId} joined the call`);
                  // Find the employee who joined
                  setEmployees((prevEmployees) => {
                    const newParticipant = prevEmployees.find(emp => emp._id === signal.participantId);
                    if (newParticipant && !callParticipants.has(newParticipant._id)) {
                      console.log(`[ChatPage] Adding ${newParticipant.name} to participant list`);
                      // Add to callParticipants - the actual connection will be established via invite/answer
                      setCallParticipants(prev => {
                        const updated = new Map(prev);
                        // Create a placeholder entry - the actual connection will be established via invite/answer
                        updated.set(newParticipant._id, {
                          employee: newParticipant,
                          peerConnection: null as any, // Will be set when connection is established
                          stream: null,
                          videoElement: null,
                          connectionState: "new",
                          iceConnectionState: "new",
                        });
                        return updated;
                      });
                      callParticipantsRef.current.set(newParticipant._id, {
                        employee: newParticipant,
                        peerConnection: null as any,
                        stream: null,
                        videoElement: null,
                        connectionState: "new",
                        iceConnectionState: "new",
                      });
                      
                      // If we're already in a call and someone joins, we should also create a connection with them
                      // This ensures bidirectional connections
                      if (chatService && localStreamRef.current) {
                        console.log(`[ChatPage] Creating connection with newly joined participant ${newParticipant.name}`);
                        setTimeout(() => {
                          addParticipantToCall(newParticipant);
                        }, 1000); // Delay to ensure their connection is ready
                      }
                    } else if (newParticipant) {
                      console.log(`[ChatPage] Participant ${newParticipant.name} already in call`);
                    }
                    return prevEmployees;
                  });
                }
                return currentlyInCall;
              case "end":
                console.log("[ChatPage] Received end call signal");
                // If we have an incoming call, clear it
                setIncomingCall(null);
                // If we're in a call, end it
                if (currentlyInCall) {
                  console.log("[ChatPage] Ending call due to remote end signal");
                  // Use setTimeout to avoid state update conflicts
                  setTimeout(() => {
                    // Stop local stream
                    if (localStreamRef.current) {
                      localStreamRef.current.getTracks().forEach((track) => track.stop());
                      localStreamRef.current = null;
                    }
                    // Close peer connections
                    if (peerConnectionRef.current) {
                      peerConnectionRef.current.close();
                      peerConnectionRef.current = null;
                    }
                    // Close all participant connections
                    callParticipants.forEach((participant) => {
                      participant.peerConnection.close();
                    });
                    // Clear video elements
                    if (localVideoRef.current) localVideoRef.current.srcObject = null;
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
                    // Clear state
                    setIsInCall(false);
                    setCallType(null);
                    setIsMuted(false);
                    setIsVideoOff(false);
                    setInCallConversationId(null);
                    setIsCaller(false);
                    setCallParticipants(new Map());
                    setShowInviteModal(false);
                    console.log("[ChatPage] Call ended by remote");
                  }, 0);
                  return false;
                }
                return currentlyInCall;
              default:
                console.warn("[ChatPage] Unknown WebRTC signal type:", type);
                return currentlyInCall;
            }
          });
        });
      })
      .catch((error) => {
        console.error('[ChatPage] Failed to connect to chat:', error);
      });

    return () => {
      // Clean up any active calls before disconnecting
      if (isInCall) {
        endCall();
      }
      // Clear any pending incoming calls
      setIncomingCall(null);
      service.disconnect();
    };
  }, [employee.accessToken, employee._id, employee.companyId]);

  // Load employees and conversations
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[ChatPage] Loading employees and conversations...', {
          hasToken: !!employee.accessToken,
          employeeId: employee._id,
          companyId: employee.companyId,
          token: employee.accessToken?.substring(0, 20) + '...'
        });
        
        // Try loading employees first to see if it works
        console.log('[ChatPage] Calling getEmployees...');
        const employeesData = await getEmployees();
        console.log('[ChatPage] Employees loaded:', employeesData);
        
        // Then load conversations
        console.log('[ChatPage] Calling getConversations...');
        const conversationsData = await getConversations();
        console.log('[ChatPage] Conversations loaded:', conversationsData);
        
        setEmployees(employeesData);
        setConversations(conversationsData);
        // Update refs for synchronous access
        employeesRef.current = employeesData;
        conversationsRef.current = conversationsData;
      } catch (error: any) {
        console.error("[ChatPage] Failed to load chat data:", error);
        // Show more detailed error to user
        const errorMessage = error?.response?.data?.error || 
                            error?.response?.data?.message || 
                            error?.message || 
                            "Failed to load employees. Please check console for details.";
        console.error("[ChatPage] Error details:", {
          message: errorMessage,
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          url: error?.config?.url,
          baseURL: error?.config?.baseURL,
          fullURL: error?.config?.baseURL + error?.config?.url,
          headers: error?.config?.headers,
          fullError: error
        });
        
        // Check if it's a network error
        if (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK' || !error?.response) {
          alert(`Network Error: Cannot connect to server.\n\nPlease check:\n1. Backend server is running (port 3000)\n2. Backend URL in .env is: ${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3000'}\n3. No firewall blocking\n4. Check browser console for full error details`);
        } else {
          alert(`Failed to load employees: ${errorMessage}\n\nStatus: ${error?.response?.status}\nCheck browser console for more details.`);
        }
      }
    };

    if (employee.accessToken && employee._id && employee.companyId) {
      loadData();
    } else {
      console.warn('[ChatPage] Missing required employee data:', {
        hasToken: !!employee.accessToken,
        hasId: !!employee._id,
        hasCompanyId: !!employee.companyId
      });
      alert('Missing employee data. Please log in again.');
    }
  }, [employee.accessToken, employee._id, employee.companyId]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      console.log('[ChatPage] Loading messages for conversation:', selectedConversation._id);
      loadMessages(selectedConversation._id);
      markAsRead(selectedConversation._id);
    } else {
      // Clear messages when no conversation is selected
      setMessages([]);
    }
  }, [selectedConversation?._id]);

  const loadMessages = async (conversationId: string) => {
    try {
      console.log('[ChatPage] Loading messages for conversation:', conversationId);
      const messagesData = await getMessages(conversationId);
      console.log('[ChatPage] Loaded messages:', messagesData.length);
      setMessages(messagesData);
      scrollToBottom();
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Ensure local video/audio stream is displayed when call starts
  // This handles the case where the video/audio element isn't ready when stream is first set
  useEffect(() => {
    if (isInCall && localStreamRef.current) {
      // Use a small timeout to ensure the DOM is fully updated
      const timer = setTimeout(() => {
        // For video calls, set local video stream
        if (callType === "video" && localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
          console.log("[ChatPage] Local video stream attached to video element via useEffect");
          
          // Ensure video plays
          localVideoRef.current.play().catch(err => {
            console.warn("[ChatPage] Error playing local video:", err);
          });
        }
        // For audio calls, ensure audio tracks are enabled
        else if (callType === "audio" && localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(track => {
            if (!track.enabled) {
              track.enabled = true;
              console.log("[ChatPage] Audio track enabled:", track.id);
            }
          });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isInCall, callType]);

  const handleSelectEmployee = async (emp: Employee) => {
    try {
      const conversation = await getOrCreateConversation(emp._id);
      setSelectedConversation(conversation);
      setSelectedEmployee(emp);
    } catch (error) {
      console.error("Failed to get/create conversation:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || !chatService) return;

    const messageContent = messageText.trim();
    const conversationId = selectedConversation._id;
    
    // Clear input immediately
    setMessageText("");
    setIsTyping(false);
    if (chatService) {
      chatService.sendTyping(conversationId, false);
    }

    // Optimistic update - add message immediately for better UX
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      conversationId: conversationId,
      senderId: {
        _id: employee._id,
        name: employee.name || "You",
        email: employee.email || "",
        characterTexture: employee.characterTexture,
      },
      content: messageContent,
      messageType: "text",
      readBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add optimistic message
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      // Use Colyseus for real-time messaging (it handles saving to DB and broadcasting)
      chatService.sendMessage(conversationId, messageContent, "text");
    } catch (error) {
      console.error("Failed to send message via WebSocket:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(m => m._id !== optimisticMessage._id));
      
      // If Colyseus fails, try REST API as fallback
      try {
        await sendMessage(conversationId, messageContent);
      } catch (restError) {
        console.error("Both Colyseus and REST API failed:", restError);
        alert("Failed to send message. Please try again.");
      }
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    if (!isTyping && chatService && selectedConversation) {
      setIsTyping(true);
      chatService.sendTyping(selectedConversation._id, true);
      setTimeout(() => {
        setIsTyping(false);
        if (chatService && selectedConversation) {
          chatService.sendTyping(selectedConversation._id, false);
        }
      }, 3000);
    }
  };

  const createPeerConnection = (
    type: "video" | "audio",
    conversationId: string
  ): RTCPeerConnection => {
    console.log(`[ChatPage] 🔵 Creating peer connection for ${type} call, conversationId: ${conversationId}`);
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });
    console.log(`[ChatPage] ✅ Peer connection created, initial state: ${pc.connectionState}, ICE state: ${pc.iceConnectionState}, signaling: ${pc.signalingState}`);

    pc.ontrack = (event) => {
      console.log(`[ChatPage] 📹 Received remote track event:`, {
        streams: event.streams.length,
        track: event.track?.kind,
        trackId: event.track?.id,
        trackState: event.track?.readyState
      });
      const stream = event.streams[0];
      if (!stream) {
        console.error(`[ChatPage] ❌ No stream in track event!`);
        return;
      }
      console.log(`[ChatPage] 📹 Stream details:`, {
        id: stream.id,
        active: stream.active,
        tracks: stream.getTracks().map(t => `${t.kind}(${t.id})`)
      });
      
      // For video calls, use video element
      if (type === "video" && remoteVideoRef.current) {
        console.log(`[ChatPage] 📹 Setting remote video stream on video element`);
        remoteVideoRef.current.srcObject = stream;
        console.log(`[ChatPage] ✅ Remote video stream set`);
        remoteVideoRef.current.play().catch(err => {
          console.error(`[ChatPage] ❌ Error playing remote video:`, err);
        });
      } 
      // For audio calls, use audio element
      else if (type === "audio" && remoteAudioRef.current) {
        console.log(`[ChatPage] 🔊 Setting remote audio stream on audio element`);
        remoteAudioRef.current.srcObject = stream;
        console.log(`[ChatPage] ✅ Remote audio stream set`);
        remoteAudioRef.current.play().catch(err => {
          console.error(`[ChatPage] ❌ Error playing remote audio:`, err);
        });
      } else {
        console.warn(`[ChatPage] ⚠️ No video/audio element available for ${type} call!`);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && chatService) {
        console.log(`[ChatPage] 🧊 ICE candidate generated:`, {
          candidate: event.candidate.candidate,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid
        });
        console.log(`[ChatPage] 📤 Sending ICE candidate to conversationId: ${conversationId}`);
        try {
          chatService.sendWebRTCSignal({
            conversationId,
            type: "candidate",
            candidate: event.candidate,
          });
          console.log(`[ChatPage] ✅ ICE candidate sent successfully`);
        } catch (error) {
          console.error(`[ChatPage] ❌ Failed to send ICE candidate:`, error);
        }
      } else if (!event.candidate) {
        console.log(`[ChatPage] ✅ All ICE candidates have been sent (null candidate received)`);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[ChatPage] 🧊 ICE connection state changed: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === "failed") {
        console.error(`[ChatPage] ❌ ICE connection FAILED!`);
      } else if (pc.iceConnectionState === "disconnected") {
        console.warn(`[ChatPage] ⚠️ ICE connection DISCONNECTED!`);
      } else if (pc.iceConnectionState === "connected") {
        console.log(`[ChatPage] ✅ ICE connection CONNECTED!`);
      } else if (pc.iceConnectionState === "checking") {
        console.log(`[ChatPage] 🔍 ICE connection CHECKING...`);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[ChatPage] 🔌 Connection state changed: ${pc.connectionState}`);
      if (pc.connectionState === "failed") {
        console.error(`[ChatPage] ❌ Peer connection FAILED!`);
        console.error(`[ChatPage] ICE connection state: ${pc.iceConnectionState}`);
        console.error(`[ChatPage] Signaling state: ${pc.signalingState}`);
        endCall();
      } else if (pc.connectionState === "connected") {
        console.log(`[ChatPage] ✅ Peer connection CONNECTED!`);
      } else if (pc.connectionState === "connecting") {
        console.log(`[ChatPage] 🔄 Peer connection CONNECTING...`);
      } else if (pc.connectionState === "disconnected") {
        console.warn(`[ChatPage] ⚠️ Peer connection DISCONNECTED!`);
      }
    };

    pc.onsignalingstatechange = () => {
      console.log(`[ChatPage] 📡 Signaling state changed: ${pc.signalingState}`);
    };

    peerConnectionRef.current = pc;
    setIsInCall(true);
    setCallType(type);
    setInCallConversationId(conversationId);

    return pc;
  };

  // Add participant to ongoing call
  const addParticipantToCall = async (employeeToAdd: Employee) => {
    if (!isInCall || !chatService || !localStreamRef.current) {
      console.warn("[ChatPage] Cannot add participant - not in a call or no local stream");
      return;
    }

    // Check if participant is already in the call
    if (callParticipants.has(employeeToAdd._id)) {
      console.log("[ChatPage] Participant already in call:", employeeToAdd.name);
      return;
    }

    try {
      console.log(`[ChatPage] Adding participant ${employeeToAdd.name} to call...`);
      
      // Create peer connection for new participant
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      // Add local tracks
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });

      // Handle remote track
      pc.ontrack = (event) => {
        console.log(`[ChatPage] Received remote track from ${employeeToAdd.name}:`, event);
        const stream = event.streams[0];
        if (!stream) {
          console.warn(`[ChatPage] No stream in event for ${employeeToAdd.name}`);
          return;
        }
        console.log(`[ChatPage] Stream received for ${employeeToAdd.name}, tracks:`, stream.getTracks().map(t => `${t.kind} (${t.readyState})`));
        remoteStreamsRef.current.set(employeeToAdd._id, stream);
        
        // Update participants state with stream
        setCallParticipants(prev => {
          const updated = new Map(prev);
          const participant = updated.get(employeeToAdd._id);
          if (participant) {
            console.log(`[ChatPage] Updating participant ${employeeToAdd.name} with stream`);
            updated.set(employeeToAdd._id, {
              ...participant,
              stream: stream,
              connectionState: participant.connectionState || pc.connectionState,
              iceConnectionState: participant.iceConnectionState || pc.iceConnectionState,
            });
            
            // For audio calls, ensure audio element is set up and playing
            if (callType === "audio") {
              // Use setTimeout to ensure the audio element is rendered
              setTimeout(() => {
                const audioEl = remoteAudioElementsRef.current.get(employeeToAdd._id);
                if (audioEl && stream) {
                  console.log(`[ChatPage] Setting audio stream for ${employeeToAdd.name} on audio element`);
                  audioEl.srcObject = stream;
                  audioEl.play().catch((err) => {
                    console.warn(`[ChatPage] Error playing audio for ${employeeToAdd.name}:`, err);
                  });
                }
              }, 100);
            }
          } else {
            console.warn(`[ChatPage] Participant ${employeeToAdd.name} not found in state when stream received`);
          }
          return updated;
        });
      };

      // Add connection state handlers for debugging and UI updates
      pc.onconnectionstatechange = () => {
        console.log(`[ChatPage] Connection state for ${employeeToAdd.name}:`, pc.connectionState);
        if (pc.connectionState === "connected") {
          console.log(`[ChatPage] ✅ Connected to ${employeeToAdd.name}`);
        } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          console.warn(`[ChatPage] ⚠️ Connection to ${employeeToAdd.name} is ${pc.connectionState}`);
        }
        // Update connection state in participants
        setCallParticipants(prev => {
          const updated = new Map(prev);
          const participant = updated.get(employeeToAdd._id);
          if (participant) {
            updated.set(employeeToAdd._id, {
              ...participant,
              connectionState: pc.connectionState,
            });
          }
          return updated;
        });
        callParticipantsRef.current.set(employeeToAdd._id, {
          ...callParticipantsRef.current.get(employeeToAdd._id)!,
          connectionState: pc.connectionState,
        });
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[ChatPage] ICE connection state for ${employeeToAdd.name}:`, pc.iceConnectionState);
        // Update ICE connection state in participants
        setCallParticipants(prev => {
          const updated = new Map(prev);
          const participant = updated.get(employeeToAdd._id);
          if (participant) {
            updated.set(employeeToAdd._id, {
              ...participant,
              iceConnectionState: pc.iceConnectionState,
            });
          }
          return updated;
        });
        callParticipantsRef.current.set(employeeToAdd._id, {
          ...callParticipantsRef.current.get(employeeToAdd._id)!,
          iceConnectionState: pc.iceConnectionState,
        });
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && chatService) {
          console.log(`[ChatPage] 🧊 ICE candidate generated for ${employeeToAdd.name}:`, {
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid
          });
          console.log(`[ChatPage] 📤 Sending ICE candidate to ${employeeToAdd.name} (${employeeToAdd._id})...`);
          try {
            chatService.sendWebRTCSignal({
              conversationId: inCallConversationId || "",
              type: "candidate",
              candidate: event.candidate,
              targetUserId: employeeToAdd._id, // Signal which participant this is for
            });
            console.log(`[ChatPage] ✅ ICE candidate sent successfully to ${employeeToAdd.name}`);
          } catch (error) {
            console.error(`[ChatPage] ❌ Failed to send ICE candidate to ${employeeToAdd.name}:`, error);
          }
        } else if (!event.candidate) {
          console.log(`[ChatPage] ✅ All ICE candidates sent to ${employeeToAdd.name} (null candidate received)`);
        }
      };

      // Create offer
      console.log(`[ChatPage] 📝 Creating offer for ${employeeToAdd.name}...`);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });
      console.log(`[ChatPage] ✅ Offer created:`, {
        type: offer.type,
        sdp: offer.sdp?.substring(0, 100) + "..."
      });
      console.log(`[ChatPage] 📝 Setting local description (offer)...`);
      await pc.setLocalDescription(offer);
      console.log(`[ChatPage] ✅ Local description set, signaling state: ${pc.signalingState}`);

      // Add participant to state AND ref synchronously
      const participantData = {
        employee: employeeToAdd,
        peerConnection: pc,
        stream: null,
        videoElement: null,
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
      };
      
      setCallParticipants(prev => {
        const updated = new Map(prev);
        updated.set(employeeToAdd._id, participantData);
        // Update ref immediately to avoid timing issues
        callParticipantsRef.current.set(employeeToAdd._id, participantData);
        return updated;
      });

      console.log(`[ChatPage] Participant ${employeeToAdd.name} added to call, peer connection created, ready for answer`);

      // Send invite signal to backend
      console.log(`[ChatPage] 📤 Sending invite signal to ${employeeToAdd.name} (${employeeToAdd._id})...`);
      console.log(`[ChatPage] Invite details:`, {
        conversationId: inCallConversationId || "",
        type: "invite",
        callType: callType || "video",
        targetUserId: employeeToAdd._id,
        offerType: offer.type
      });
      try {
        chatService.sendWebRTCSignal({
          conversationId: inCallConversationId || "",
          type: "invite",
          sdp: offer,
          callType: callType || "video",
          targetUserId: employeeToAdd._id,
        });
        console.log(`[ChatPage] ✅ Invite sent successfully to ${employeeToAdd.name}`);
        
        // Broadcast participant_joined signal to all participants in the conversation
        // This ensures all existing participants know about the new participant
        console.log(`[ChatPage] 📢 Broadcasting participant_joined signal for ${employeeToAdd.name}`);
        chatService.sendWebRTCSignal({
          conversationId: inCallConversationId || "",
          type: "participant_joined",
          participantId: employeeToAdd._id,
          callType: callType || "video",
        });
      } catch (error) {
        console.error(`[ChatPage] ❌ Failed to send invite to ${employeeToAdd.name}:`, error);
      }
    } catch (error) {
      console.error(`[ChatPage] Failed to add participant ${employeeToAdd.name}:`, error);
      alert(`Failed to invite ${employeeToAdd.name} to the call`);
    }
  };

  // Start an outgoing call (can be 1-on-1 or group)
  const setupWebRTC = async (type: "video" | "audio") => {
    if (!selectedConversation || !chatService) {
      alert("Please select a conversation first");
      return;
    }

    if (isInCall) {
      alert("You are already in a call. Please end the current call first.");
      return;
    }

    try {
      console.log(`[ChatPage] Starting ${type} call...`);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });

      console.log("[ChatPage] Got local media stream");
      localStreamRef.current = stream;
      // Set stream to video element if it exists, otherwise useEffect will handle it
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log("[ChatPage] Local video stream set immediately");
        // Ensure video plays
        localVideoRef.current.play().catch(err => {
          console.warn("[ChatPage] Error playing local video:", err);
        });
      } else {
        console.log("[ChatPage] Local video element not ready, will be set when modal renders");
      }

      const pc = createPeerConnection(type, selectedConversation._id);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
        console.log(`[ChatPage] Added track: ${track.kind}`, track);
      });

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === "video",
      });
      await pc.setLocalDescription(offer);
      console.log("[ChatPage] Created and set local offer");

      chatService.sendWebRTCSignal({
        conversationId: selectedConversation._id,
        type: "offer",
        sdp: offer,
        callType: type,
      });

      setIsCaller(true);
      console.log("[ChatPage] Call offer sent");
    } catch (error: any) {
      console.error("Failed to setup WebRTC:", error);
      let errorMessage = "Failed to start call.";
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage = "Please allow camera/microphone permissions to make calls.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage = "No camera/microphone found. Please connect a device.";
      }
      alert(errorMessage);
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall || !chatService) {
      console.warn("[ChatPage] No incoming call or chatService available");
      return;
    }

    const { conversationId, sdp, callType } = incomingCall;

    if (isInCall) {
      console.log("[ChatPage] Already in a call, cannot accept");
      setIncomingCall(null);
      return;
    }

    try {
      console.log(`[ChatPage] Accepting incoming ${callType} call...`);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });

      console.log("[ChatPage] Got local media stream for accepted call");
      localStreamRef.current = stream;
      // Set stream to video element if it exists, otherwise useEffect will handle it
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log("[ChatPage] Local video stream set immediately for accepted call");
        // Ensure video plays
        localVideoRef.current.play().catch(err => {
          console.warn("[ChatPage] Error playing local video:", err);
        });
      } else {
        console.log("[ChatPage] Local video element not ready, will be set when modal renders");
      }

      // Ensure selectedEmployee is set correctly
      // For group calls, set to the inviter (fromUserId)
      // For regular calls, set from conversation
      if (incomingCall.isGroupInvite && incomingCall.fromUserId) {
        // Find the inviter from employees list
        setEmployees((prevEmployees) => {
          const inviter = prevEmployees.find(emp => emp._id === incomingCall.fromUserId);
          if (inviter) {
            setSelectedEmployee(inviter);
            console.log("[ChatPage] Set selectedEmployee to inviter for group call:", inviter.name);
          } else {
            // Fallback to conversation participant
            setConversations((prevConvs) => {
              const conv = prevConvs.find(c => c._id === conversationId);
              if (conv) {
                const other = getOtherParticipant(conv);
                if (other) {
                  setSelectedEmployee(other);
                  console.log("[ChatPage] Set selectedEmployee from conversation:", other.name);
                }
              }
              return prevConvs;
            });
          }
          return prevEmployees;
        });
      } else {
        // Regular call - set from conversation
        setConversations((prevConvs) => {
          const conv = prevConvs.find(c => c._id === conversationId);
          if (conv) {
            const other = getOtherParticipant(conv);
            if (other) {
              setSelectedEmployee(other);
              console.log("[ChatPage] Set selectedEmployee for accepted call:", other.name);
            }
          }
          return prevConvs;
        });
      }

      const pc = createPeerConnection(callType, conversationId);

      // If this is a group call invite, override the ICE candidate handler to send with targetUserId
      const targetUserId = incomingCall.isGroupInvite ? incomingCall.fromUserId : undefined;
      if (targetUserId) {
        console.log(`[ChatPage] Overriding ICE candidate handler for group call, targetUserId: ${targetUserId}`);
        pc.onicecandidate = (event) => {
          if (event.candidate && chatService) {
            console.log(`[ChatPage] 🧊 ICE candidate generated for inviter ${targetUserId}:`, {
              candidate: event.candidate.candidate,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid
            });
            console.log(`[ChatPage] 📤 Sending ICE candidate to inviter ${targetUserId}...`);
            try {
              chatService.sendWebRTCSignal({
                conversationId,
                type: "candidate",
                candidate: event.candidate,
                targetUserId: targetUserId, // Send to inviter for group calls
              });
              console.log(`[ChatPage] ✅ ICE candidate sent successfully to inviter ${targetUserId}`);
            } catch (error) {
              console.error(`[ChatPage] ❌ Failed to send ICE candidate to inviter ${targetUserId}:`, error);
            }
          } else if (!event.candidate) {
            console.log(`[ChatPage] ✅ All ICE candidates sent to inviter ${targetUserId} (null candidate received)`);
          }
        };
      }

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
        console.log(`[ChatPage] Added track for accepted call: ${track.kind}`);
      });

      console.log(`[ChatPage] 📝 Setting remote description (offer) for accepted call...`);
      console.log(`[ChatPage] Offer details:`, {
        type: sdp.type,
        sdp: sdp.sdp?.substring(0, 100) + "..."
      });
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      console.log(`[ChatPage] ✅ Remote description set, signaling state: ${pc.signalingState}`);
      
      console.log(`[ChatPage] 📝 Creating answer...`);
      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });
      console.log(`[ChatPage] ✅ Answer created:`, {
        type: answer.type,
        sdp: answer.sdp?.substring(0, 100) + "..."
      });
      console.log(`[ChatPage] 📝 Setting local description (answer)...`);
      await pc.setLocalDescription(answer);
      console.log(`[ChatPage] ✅ Local description set, signaling state: ${pc.signalingState}`);

      // If this is a group call invite, send answer to the inviter
      console.log(`[ChatPage] 📤 Sending answer signal...`);
      console.log(`[ChatPage] Answer details:`, {
        conversationId,
        type: "answer",
        callType: callType,
        isGroupInvite: incomingCall.isGroupInvite,
        targetUserId: targetUserId,
        answerType: answer.type
      });
      try {
        chatService.sendWebRTCSignal({
          conversationId,
          type: "answer",
          sdp: answer,
          callType: callType,
          targetUserId: targetUserId, // Send to inviter for group calls
        });
        console.log(`[ChatPage] ✅ Answer sent successfully${targetUserId ? ` to inviter ${targetUserId}` : ''}`);
      } catch (error) {
        console.error(`[ChatPage] ❌ Failed to send answer:`, error);
      }

      setIsCaller(false);
      
      // Store incomingCall data before clearing it, as we need it below
      const wasGroupInvite = incomingCall.isGroupInvite;
      const inviterId = incomingCall.fromUserId;
      setIncomingCall(null); // Clear incoming call state
      
      // If this is a group call, we need to connect to all existing participants
      // After accepting, we should also create connections with other participants in the conversation
      if (wasGroupInvite && chatService) {
        console.log(`[ChatPage] 📢 Group call accepted, checking for other participants...`);
        // Get all participants from the conversation and create connections with them
        setTimeout(() => {
          setConversations((prevConvs) => {
            const conv = prevConvs.find(c => c._id === conversationId);
            if (conv && conv.participants) {
              // Find all participants except ourselves and the inviter (we already connected to inviter)
              const otherParticipants = conv.participants.filter((p: Employee) => {
                const pId = p._id?.toString() || p.toString();
                return pId !== employee._id && pId !== inviterId;
              });
              
              console.log(`[ChatPage] Found ${otherParticipants.length} other participants in conversation to connect with`);
              
              // Create connections with all other participants
              otherParticipants.forEach((participant: Employee) => {
                console.log(`[ChatPage] Creating connection with participant ${participant.name}...`);
                // Add participant to call (this will create peer connection and send invite)
                addParticipantToCall(participant);
              });
              
              // Also, send a participant_joined signal so existing participants know we joined
              // This will trigger them to add us to their participant list and create connections with us
              console.log(`[ChatPage] 📢 Broadcasting that we joined the call`);
              chatService.sendWebRTCSignal({
                conversationId,
                type: "participant_joined",
                participantId: employee._id,
                callType: callType,
              });
              
              // Also, request participant list from existing participants
              // This ensures we see all participants who are already in the call
              console.log(`[ChatPage] 📋 Requesting participant list from existing participants`);
              // The participant_joined signal will trigger existing participants to add us
              // and they will also create connections with us via the invite signal handling
            }
            return prevConvs;
          });
        }, 1500); // Delay to ensure main connection is established first
      }
      
      console.log(`[ChatPage] ✅ Call accepted and answer sent, connection state: ${pc.connectionState}, ICE state: ${pc.iceConnectionState}`);
    } catch (error: any) {
      console.error("Failed to accept call:", error);
      let errorMessage = "Failed to accept call.";
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage = "Please allow camera/microphone permissions to accept calls.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage = "No camera/microphone found. Please connect a device.";
      }
      alert(errorMessage);
      setIncomingCall(null);
      endCall();
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (!incomingCall || !chatService) {
      console.warn("[ChatPage] No incoming call or chatService available");
      return;
    }

    console.log("[ChatPage] Rejecting incoming call");
    
    // Send end signal to notify caller
    chatService.sendWebRTCSignal({
      conversationId: incomingCall.conversationId,
      type: "end",
    });

    setIncomingCall(null);
  };

  const handleAnswer = async (sdp: any) => {
    console.log(`[ChatPage] 📥 Received answer signal for main peer connection`);
    if (!peerConnectionRef.current) {
      console.error(`[ChatPage] ❌ No peer connection available for answer!`);
      return;
    }
    console.log(`[ChatPage] Current states before answer:`, {
      connectionState: peerConnectionRef.current.connectionState,
      iceConnectionState: peerConnectionRef.current.iceConnectionState,
      signalingState: peerConnectionRef.current.signalingState
    });
    try {
      console.log(`[ChatPage] 📝 Setting remote description (answer)...`);
      console.log(`[ChatPage] Answer details:`, {
        type: sdp.type,
        sdp: sdp.sdp?.substring(0, 100) + "..."
      });
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(sdp)
      );
      console.log(`[ChatPage] ✅ Remote description set from answer, signaling state: ${peerConnectionRef.current.signalingState}`);
      
      // Ensure selectedEmployee is set when answer is received
      if (!selectedEmployee && inCallConversationId) {
        setConversations((prevConvs) => {
          const conv = prevConvs.find(c => c._id === inCallConversationId);
          if (conv) {
            const other = getOtherParticipant(conv);
            if (other) {
              setSelectedEmployee(other);
              console.log("[ChatPage] Set selectedEmployee from answer:", other.name);
            }
          }
          return prevConvs;
        });
      }
    } catch (error) {
      console.error("Failed to handle answer:", error);
    }
  };

  const handleRemoteCandidate = async (candidate: any) => {
    console.log(`[ChatPage] 🧊 Received ICE candidate for main peer connection`);
    if (!peerConnectionRef.current) {
      console.error(`[ChatPage] ❌ No peer connection available for candidate!`);
      return;
    }
    if (!candidate) {
      console.warn(`[ChatPage] ⚠️ No candidate data provided!`);
      return;
    }
    console.log(`[ChatPage] Candidate details:`, {
      candidate: candidate.candidate,
      sdpMLineIndex: candidate.sdpMLineIndex,
      sdpMid: candidate.sdpMid
    });
    console.log(`[ChatPage] Current states:`, {
      connectionState: peerConnectionRef.current.connectionState,
      iceConnectionState: peerConnectionRef.current.iceConnectionState,
      signalingState: peerConnectionRef.current.signalingState
    });
    try {
      await peerConnectionRef.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
      console.log(`[ChatPage] ✅ ICE candidate added successfully`);
    } catch (error) {
      console.error(`[ChatPage] ❌ Failed to add remote ICE candidate:`, error);
      console.error(`[ChatPage] Error details:`, error);
    }
  };

  // Sync callParticipants ref with state
  useEffect(() => {
    callParticipantsRef.current = callParticipants;
  }, [callParticipants]);

  // Handle answer from a specific participant (group call)
  const handleParticipantAnswer = async (participantId: string, sdp: any) => {
    // Use ref to get latest value to avoid stale closure
    const participant = callParticipantsRef.current.get(participantId);
    if (!participant || !participant.peerConnection) {
      console.warn(`[ChatPage] No peer connection found for participant ${participantId}`);
      console.log(`[ChatPage] Current participants in ref:`, Array.from(callParticipantsRef.current.keys()));
      console.log(`[ChatPage] Participant map size:`, callParticipantsRef.current.size);
      // Try to find the participant by iterating
      callParticipantsRef.current.forEach((p, id) => {
        console.log(`[ChatPage] Participant in map: ${id} -> ${p.employee.name}`);
      });
      return;
    }
    try {
      const participantName = participant.employee?.name || participantId;
      console.log(`[ChatPage] Setting remote description (answer) for participant ${participantName}`);
      console.log(`[ChatPage] Current connection state before answer:`, participant.peerConnection.connectionState);
      console.log(`[ChatPage] Current ICE connection state:`, participant.peerConnection.iceConnectionState);
      console.log(`[ChatPage] Current signaling state:`, participant.peerConnection.signalingState);
      
      await participant.peerConnection.setRemoteDescription(
        new RTCSessionDescription(sdp)
      );
      console.log(`[ChatPage] ✅ Successfully set remote description from answer for participant ${participantName}`);
      console.log(`[ChatPage] Signaling state after answer:`, participant.peerConnection.signalingState);
      console.log(`[ChatPage] Connection state after answer:`, participant.peerConnection.connectionState);
      console.log(`[ChatPage] ICE connection state:`, participant.peerConnection.iceConnectionState);
    } catch (error) {
      console.error(`[ChatPage] ❌ Failed to handle answer for participant ${participantId}:`, error);
      console.error(`[ChatPage] Error details:`, error);
    }
  };

  // Handle ICE candidate from a specific participant (group call)
  const handleParticipantCandidate = async (participantId: string, candidate: any) => {
    console.log(`[ChatPage] 🧊 Handling ICE candidate for participant ${participantId}`);
    // Use ref to get latest value to avoid stale closure
    const participant = callParticipantsRef.current.get(participantId);
    if (!participant || !participant.peerConnection || !candidate) {
      console.error(`[ChatPage] ❌ Cannot add ICE candidate for participant ${participantId}:`, {
        hasParticipant: !!participant,
        hasPeerConnection: !!participant?.peerConnection,
        hasCandidate: !!candidate,
        participantName: participant?.employee?.name
      });
      return;
    }
    try {
      const participantName = participant.employee?.name || participantId;
      console.log(`[ChatPage] 📝 Adding ICE candidate for participant ${participantName}`);
      console.log(`[ChatPage] Candidate details:`, {
        candidate: candidate.candidate,
        sdpMLineIndex: candidate.sdpMLineIndex,
        sdpMid: candidate.sdpMid
      });
      console.log(`[ChatPage] Peer connection states:`, {
        connectionState: participant.peerConnection.connectionState,
        iceConnectionState: participant.peerConnection.iceConnectionState,
        signalingState: participant.peerConnection.signalingState
      });
      await participant.peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
      console.log(`[ChatPage] ✅ Successfully added ICE candidate for participant ${participantName}`);
      console.log(`[ChatPage] Updated ICE connection state: ${participant.peerConnection.iceConnectionState}`);
    } catch (error) {
      console.error(`[ChatPage] ❌ Failed to add ICE candidate for participant ${participantId}:`, error);
      console.error(`[ChatPage] Error details:`, error);
      console.error(`[ChatPage] Peer connection states at error:`, {
        connectionState: participant.peerConnection.connectionState,
        iceConnectionState: participant.peerConnection.iceConnectionState,
        signalingState: participant.peerConnection.signalingState
      });
    }
  };

  const endCall = () => {
    console.log("[ChatPage] Ending call...");
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    
    // Close main peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Close all participant peer connections (for group calls)
    callParticipants.forEach((participant) => {
      console.log(`[ChatPage] Closing peer connection for participant: ${participant.employee.name}`);
      participant.peerConnection.close();
    });
    
    // Clear video/audio elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    
    // Clear all remote streams
    remoteStreamsRef.current.clear();
    remoteVideoElementsRef.current.clear();
    
    // Notify all participants that call has ended
    if (chatService && inCallConversationId) {
      // Send end signal to all participants in group call
      if (callParticipants.size > 0) {
        callParticipants.forEach((participant) => {
          console.log(`[ChatPage] Sending end signal to ${participant.employee.name}`);
          chatService.sendWebRTCSignal({
            conversationId: inCallConversationId,
            type: "end",
            targetUserId: participant.employee._id, // Send to specific participant
          });
        });
      }
      
      // Also send general end signal for 1-on-1 calls
      chatService.sendWebRTCSignal({
        conversationId: inCallConversationId,
        type: "end",
      });
      
      console.log("[ChatPage] End signal sent to all participants");
    }

    // Reset all state
    setIsInCall(false);
    setCallType(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setInCallConversationId(null);
    setIsCaller(false);
    setIncomingCall(null);
    setCallParticipants(new Map());
    setShowInviteModal(false);
    
    console.log("[ChatPage] Call ended and state cleared");
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const newMutedState = !isMuted;
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMutedState; // When muted, track should be disabled
      });
      setIsMuted(newMutedState);
    }
    
    // Try to play remote audio if it's an audio call (handles autoplay restrictions)
    // User interaction (clicking mute button) allows audio to play
    if (callType === "audio" && remoteAudioRef.current) {
      remoteAudioRef.current.play().catch(err => {
        // Silently fail - audio might already be playing
        console.log("[ChatPage] Remote audio play attempt:", err.message);
      });
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const newVideoOffState = !isVideoOff;
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !newVideoOffState; // When video is off, track should be disabled
      });
      setIsVideoOff(newVideoOffState);
    }
  };

  const getOtherParticipant = (conversation: Conversation): Employee | null => {
    if (!conversation.participants) return null;
    const other = conversation.participants.find(
      (p) => p._id !== employee._id
    );
    return other || null;
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConversations = conversations.filter((conv) => {
    const other = getOtherParticipant(conv);
    if (!other) return false;
    return (
      other.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      other.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Employees and Conversations */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
            <button
              onClick={() => navigate("/employee/workspace")}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => {
            const other = getOtherParticipant(conversation);
            if (!other) return null;

            const isSelected =
              selectedConversation?._id === conversation._id;

            return (
              <div
                key={conversation._id}
                onClick={() => {
                  setSelectedConversation(conversation);
                  setSelectedEmployee(other);
                }}
                className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                  isSelected ? "bg-blue-50" : ""
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {other.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {other.name}
                    </h3>
                    {conversation.lastMessageAt && (
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(conversation.lastMessageAt).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.lastMessage?.content || "No messages yet"}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Employees List (for starting new conversations) */}
          {filteredEmployees.length > 0 && (
            <>
              <div className="px-4 py-3 bg-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">
                  Start New Conversation
                </h3>
              </div>
              {filteredEmployees.map((emp) => {
                const hasConversation = conversations.some((conv) =>
                  conv.participants.some((p) => p._id === emp._id)
                );
                if (hasConversation) return null;

                return (
                  <div
                    key={emp._id}
                    onClick={() => handleSelectEmployee(emp)}
                    className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="font-semibold text-gray-800">{emp.name}</h3>
                      <p className="text-sm text-gray-600">{emp.position || emp.email}</p>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      {selectedConversation && selectedEmployee ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                {selectedEmployee.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <h2 className="font-semibold text-gray-800">
                  {selectedEmployee.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedEmployee.position || selectedEmployee.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setupWebRTC("audio")}
                className="p-2 hover:bg-gray-100 rounded-full"
                title="Audio Call"
              >
                <Phone className="w-5 h-5 text-blue-500" />
              </button>
              <button
                onClick={() => setupWebRTC("video")}
                className="p-2 hover:bg-gray-100 rounded-full"
                title="Video Call"
              >
                <Video className="w-5 h-5 text-blue-500" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
            {messages
              .filter((msg) => !selectedConversation || msg.conversationId === selectedConversation._id)
              .map((msg) => {
              const isMe = msg.senderId._id === employee._id;
              return (
                <div
                  key={msg._id}
                  className={`flex mb-6 ${isMe ? "justify-end" : "justify-start"}`}
                >
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm mr-2 flex-shrink-0">
                      {msg.senderId.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`max-w-md ${isMe ? "order-first" : ""}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        isMe
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    <div
                      className={`flex items-center mt-1 space-x-1 ${
                        isMe ? "justify-end" : ""
                      }`}
                    >
                      <span className="text-xs text-gray-500">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  {isMe && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm ml-2 flex-shrink-0">
                      {employee.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              );
            })}
            {typingUser && (
              <div className="flex justify-start mb-6">
                <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-bl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={handleTyping}
                  onKeyDown={(e) => {
                    // Stop propagation to prevent global keyboard handlers from interfering
                    e.stopPropagation();
                    // Allow all keys to work normally
                  }}
                  onKeyPress={(e) => {
                    // Stop propagation for all key presses
                    e.stopPropagation();
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent focus:outline-none text-gray-800"
                  autoComplete="off"
                  spellCheck="true"
                />
              </div>
              <button
                type="submit"
                className="p-3 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Select a conversation to start chatting</p>
          </div>
        </div>
      )}

      {/* Incoming Call Modal */}
      {incomingCall && !isInCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-6">
                {incomingCall.callType === "video" ? (
                  <Video className="w-20 h-20 text-blue-500 mx-auto mb-4" />
                ) : (
                  <Phone className="w-20 h-20 text-blue-500 mx-auto mb-4" />
                )}
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                {incomingCall.isGroupInvite 
                  ? `Group ${incomingCall.callType === "video" ? "Video" : "Audio"} Call Invitation`
                  : `Incoming ${incomingCall.callType === "video" ? "Video" : "Audio"} Call`}
              </h3>
              <p className="text-lg text-gray-600 mb-2">
                {incomingCall.isGroupInvite 
                  ? `${incomingCall.callerName} is inviting you to join a group call`
                  : `${incomingCall.callerName} is calling you`}
              </p>
              {incomingCall.isGroupInvite && (
                <p className="text-sm text-gray-500 mb-8">You'll join an ongoing call</p>
              )}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={rejectCall}
                  className="p-4 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                  title="Reject"
                >
                  <Phone className="w-6 h-6 rotate-135" />
                </button>
                <button
                  onClick={acceptCall}
                  className="p-4 bg-green-500 hover:bg-green-600 rounded-full text-white transition-colors"
                  title="Accept"
                >
                  <Phone className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {isInCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-semibold">
                  {callType === "video" ? "Video Call" : "Audio Call"}
                </h3>
                <span className="text-sm text-gray-500 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {(() => {
                    // Count: local (1) + selectedEmployee (1 if exists) + callParticipants
                    const total = 1 + (selectedEmployee ? 1 : 0) + callParticipants.size;
                    return `${total} participant${total !== 1 ? 's' : ''}`;
                  })()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                  title="Invite Participants"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
                <button
                  onClick={endCall}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className={`grid gap-4 mb-4 ${
              callType === "video" 
                ? callParticipants.size === 0 
                  ? "grid-cols-2" 
                  : (() => {
                    const totalParticipants = callParticipants.size + (selectedEmployee ? 1 : 0) + 1; // +1 for local video
                    if (totalParticipants <= 2) return "grid-cols-2";
                    if (totalParticipants <= 4) return "grid-cols-2";
                    if (totalParticipants <= 6) return "grid-cols-3";
                    return "grid-cols-4";
                  })()
                : "grid-cols-1"
            }`}>
              {callType === "video" ? (
                <>
                  {/* Local video */}
                  <div className="relative">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                    />
                    <p className="text-sm text-gray-600 mt-2">You</p>
                  </div>
                  
                  {/* Remote participants - show all if group call, otherwise show single */}
                  {callParticipants.size === 0 ? (
                    // Single participant (original behavior)
                    <div className="relative">
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        {selectedEmployee?.name || (incomingCall?.callerName || "Participant")}
                      </p>
                    </div>
                  ) : (
                    // Multiple participants - show main connection + all callParticipants
                    <>
                      {/* Main peer connection participant (the original 1-on-1 connection) */}
                      {selectedEmployee && (
                        <div className="relative">
                          <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                          />
                          <p className="text-sm text-gray-600 mt-2">
                            {selectedEmployee.name}
                          </p>
                        </div>
                      )}
                      {/* Additional participants from group call */}
                      {Array.from(callParticipants.entries()).map(([participantId, participant]) => (
                      <div key={participantId} className="relative">
                        {participant.stream ? (
                          <video
                            ref={(el) => {
                              if (el) {
                                if (participant.stream) {
                                  console.log(`[ChatPage] Setting video element for ${participant.employee.name}, stream tracks:`, participant.stream.getTracks().map(t => `${t.kind} (${t.readyState})`));
                                  el.srcObject = participant.stream;
                                  el.play().catch((err) => {
                                    console.warn(`[ChatPage] Error playing video for ${participant.employee.name}:`, err);
                                  });
                                  remoteVideoElementsRef.current.set(participantId, el);
                                } else {
                                  console.warn(`[ChatPage] Video element ref set but no stream for ${participant.employee.name}`);
                                }
                              }
                            }}
                            autoPlay
                            playsInline
                            className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                            onLoadedMetadata={() => {
                              console.log(`[ChatPage] Video metadata loaded for ${participant.employee.name}`);
                            }}
                            onCanPlay={() => {
                              console.log(`[ChatPage] Video can play for ${participant.employee.name}`);
                            }}
                          />
                        ) : (
                          <div className="w-full h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold mx-auto mb-2">
                                {participant.employee.name.charAt(0).toUpperCase()}
                              </div>
                              <p className="text-white text-sm">{participant.employee.name}</p>
                            </div>
                          </div>
                        )}
                        <p className="text-sm text-gray-600 mt-2">
                          {participant.employee.name}
                        </p>
                      </div>
                      ))}
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Hidden audio elements for audio-only calls to play remote audio */}
                  {/* Single participant audio call */}
                  {callParticipants.size === 0 ? (
                    <audio
                      ref={remoteAudioRef}
                      autoPlay
                      playsInline
                      className="hidden"
                      onLoadedMetadata={(e) => {
                        const audio = e.currentTarget;
                        audio.play().catch(err => {
                          console.warn("[ChatPage] Autoplay prevented, user interaction required:", err);
                        });
                      }}
                    />
                  ) : (
                    // Multiple participants - create audio element for each
                    Array.from(callParticipants.entries()).map(([participantId, participant]) => (
                      <audio
                        key={participantId}
                        ref={(el) => {
                          if (el) {
                            remoteAudioElementsRef.current.set(participantId, el);
                            // If stream already exists, set it immediately
                            if (participant.stream) {
                              console.log(`[ChatPage] Setting audio element for ${participant.employee.name}, stream tracks:`, participant.stream.getTracks().map(t => `${t.kind} (${t.readyState})`));
                              el.srcObject = participant.stream;
                              el.play().catch((err) => {
                                console.warn(`[ChatPage] Error playing audio for ${participant.employee.name}:`, err);
                              });
                            }
                          }
                        }}
                        autoPlay
                        playsInline
                        className="hidden"
                        onLoadedMetadata={(e) => {
                          const audio = e.currentTarget;
                          audio.play().catch(err => {
                            console.warn(`[ChatPage] Autoplay prevented for ${participant.employee.name}:`, err);
                          });
                        }}
                      />
                    ))
                  )}
                  
                  {/* Audio call UI */}
                  {callParticipants.size === 0 ? (
                    // Single participant
                    <div className="flex items-center justify-center h-64 bg-gray-900 rounded-lg">
                      <div className="text-center">
                        <Phone className="w-16 h-16 text-white mx-auto mb-4" />
                        <p className="text-white text-lg font-semibold">
                          {selectedEmployee?.name || (incomingCall?.callerName || "Participant")}
                        </p>
                        <p className="text-gray-400 text-sm">Audio Call</p>
                      </div>
                    </div>
                  ) : (
                    // Multiple participants - show local + main participant + all callParticipants
                    <div className={`grid gap-4 ${
                      (() => {
                        const totalParticipants = callParticipants.size + (selectedEmployee ? 1 : 0) + 1; // +1 for local
                        if (totalParticipants <= 2) return "grid-cols-2";
                        if (totalParticipants <= 4) return "grid-cols-2";
                        if (totalParticipants <= 6) return "grid-cols-3";
                        return "grid-cols-4";
                      })()
                    }`}>
                      {/* Local participant */}
                      <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold mx-auto mb-2">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-white text-sm">You</p>
                        </div>
                      </div>
                      
                      {/* Main peer connection participant (the original 1-on-1 connection) */}
                      {selectedEmployee && (
                        <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
                          <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-semibold mx-auto mb-2">
                              {selectedEmployee.name.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-white text-sm">{selectedEmployee.name}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Additional participants from group call */}
                      {Array.from(callParticipants.entries()).map(([participantId, participant]) => (
                        <div key={participantId} className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
                          <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-semibold mx-auto mb-2">
                              {participant.employee.name.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-white text-sm">{participant.employee.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-full ${
                  isMuted ? "bg-red-500" : "bg-gray-400"
                } text-white`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              {callType === "video" && (
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full ${
                    isVideoOff ? "bg-red-500" : "bg-gray-400"
                  } text-white`}
                >
                  <VideoOff className="w-6 h-6" />
                </button>
              )}
              <button
                onClick={endCall}
                className="p-3 bg-red-500 rounded-full text-white"
              >
                <Phone className="w-6 h-6 rotate-135" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Participants Modal */}
      {showInviteModal && isInCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Invite Participants</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={inviteSearchQuery}
                onChange={(e) => setInviteSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Employee List */}
            <div className="flex-1 overflow-y-auto">
              {employees
                .filter((emp) => {
                  // Filter out current user and already added participants
                  if (emp._id === employee._id) return false;
                  if (callParticipants.has(emp._id)) return false;
                  if (selectedEmployee && emp._id === selectedEmployee._id) return false;
                  
                  // Filter by search query
                  const query = inviteSearchQuery.toLowerCase();
                  return (
                    emp.name.toLowerCase().includes(query) ||
                    emp.email.toLowerCase().includes(query)
                  );
                })
                .map((emp) => (
                  <div
                    key={emp._id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <h4 className="font-semibold text-gray-800">{emp.name}</h4>
                        <p className="text-sm text-gray-600">{emp.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        addParticipantToCall(emp);
                        setShowInviteModal(false);
                      }}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Invite</span>
                    </button>
                  </div>
                ))}
              
              {employees.filter((emp) => {
                if (emp._id === employee._id) return false;
                if (callParticipants.has(emp._id)) return false;
                if (selectedEmployee && emp._id === selectedEmployee._id) return false;
                const query = inviteSearchQuery.toLowerCase();
                return (
                  emp.name.toLowerCase().includes(query) ||
                  emp.email.toLowerCase().includes(query)
                );
              }).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No employees available to invite</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

