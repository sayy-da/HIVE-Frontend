import { axiosGetRequest, axiosPostRequest } from "../config/axios";
import { BACKEND_BASE_URL } from "../constants/API";

export interface Employee {
  _id: string;
  name: string;
  email: string;
  position?: string;
  characterTexture?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    characterTexture?: string;
  };
  content: string;
  messageType: "text" | "image" | "file";
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: Employee[];
  companyId: string;
  lastMessage?: Message;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Get employees of the same company
export const getEmployees = async (): Promise<Employee[]> => {
  try {
    console.log('[Chat API] Calling /chat/employees');
    const res = await axiosGetRequest("/chat/employees");
    console.log('[Chat API] Response received:', res);
    if (!res) {
      console.warn('[Chat API] No response from getEmployees');
      return [];
    }
    return res.data as Employee[];
  } catch (error: any) {
    console.error('[Chat API] Error in getEmployees:', error);
    throw error; // Re-throw to let the component handle it
  }
};

// Get all conversations
export const getConversations = async (): Promise<Conversation[]> => {
  const res = await axiosGetRequest("/chat/conversations");
  if (!res) return [];
  return res.data as Conversation[];
};

// Get or create a conversation
export const getOrCreateConversation = async (
  employeeId2: string
): Promise<Conversation> => {
  const res = await axiosPostRequest("/chat/conversation", { employeeId2 });
  if (!res) throw new Error("Failed to get/create conversation");
  return res.data as Conversation;
};

// Send a message
export const sendMessage = async (
  conversationId: string,
  content: string,
  messageType: "text" | "image" | "file" = "text"
): Promise<Message> => {
  const res = await axiosPostRequest("/chat/message", {
    conversationId,
    content,
    messageType,
  });
  if (!res) throw new Error("Failed to send message");
  return res.data as Message;
};

// Get messages for a conversation
export const getMessages = async (
  conversationId: string,
  limit: number = 50,
  skip: number = 0
): Promise<Message[]> => {
  const res = await axiosGetRequest(
    `/chat/messages/${conversationId}?limit=${limit}&skip=${skip}`
  );
  if (!res) return [];
  return res.data as Message[];
};

// Mark conversation as read
export const markAsRead = async (conversationId: string): Promise<void> => {
  await axiosPostRequest(`/chat/conversation/${conversationId}/read`, {});
};

// Get Socket.io URL
export const getSocketUrl = (): string => {
  return BACKEND_BASE_URL;
};

