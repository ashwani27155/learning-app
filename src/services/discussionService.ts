import { api } from "../lib/api";

export interface DiscussionUser {
  id: string;
  name: string;
  avatar?: string;
}

export interface DiscussionPost {
  id: string;
  content: string;
  upvotes: number;
  isResolved: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  questionId?: string | null;
  testId?: string | null;
  user: DiscussionUser;
  _count: { replies: number };
}

export interface DiscussionReply {
  id: string;
  content: string;
  postId: string;
  createdAt: string;
  user: DiscussionUser;
}

export interface PaginatedPosts {
  posts: DiscussionPost[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedReplies {
  replies: DiscussionReply[];
  total: number;
  page: number;
  limit: number;
}

export const discussionService = {
  async listPosts(params: { questionId?: string; testId?: string; page?: number; limit?: number } = {}): Promise<PaginatedPosts> {
    return api.get("/discussions", { params });
  },

  async createPost(data: { content: string; questionId?: string; testId?: string }): Promise<DiscussionPost> {
    return api.post("/discussions", data);
  },

  async getReplies(postId: string, params: { page?: number; limit?: number } = {}): Promise<PaginatedReplies> {
    return api.get(`/discussions/${postId}/replies`, { params });
  },

  async createReply(postId: string, content: string): Promise<DiscussionReply> {
    return api.post(`/discussions/${postId}/replies`, { content });
  },

  async resolvePost(postId: string): Promise<void> {
    await api.patch(`/discussions/${postId}/resolve`);
  },

  async upvotePost(postId: string): Promise<{ id: string; upvotes: number }> {
    return api.post(`/discussions/${postId}/upvote`);
  },
};
