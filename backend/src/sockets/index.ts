import { Server as SocketServer, Socket } from 'socket.io';
import { Server } from 'http';
import { getSupabaseAdminClient } from '../config/supabase.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  projectRooms?: Set<string>;
}

let io: SocketServer;

/**
 * Initialize Socket.IO server
 */
export function initializeSocketServer(httpServer: Server): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const supabase = getSupabaseAdminClient();
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return next(new Error('Invalid token'));
      }

      socket.userId = user.id;
      socket.projectRooms = new Set();
      next();
    } catch (error) {
      logger.error('Socket authentication error', { error });
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('Client connected', { socketId: socket.id, userId: socket.userId });

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Handle joining project rooms
    socket.on('join:project', async (projectId: string) => {
      try {
        // Verify user is member of project
        const supabase = getSupabaseAdminClient();
        const { data: member } = await supabase
          .from('project_members')
          .select('id')
          .eq('project_id', projectId)
          .eq('user_id', socket.userId)
          .single();

        if (member) {
          socket.join(`project:${projectId}`);
          socket.projectRooms?.add(projectId);
          logger.info('User joined project room', { userId: socket.userId, projectId });
        }
      } catch (error) {
        logger.error('Error joining project room', { error, projectId });
      }
    });

    // Handle leaving project rooms
    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      socket.projectRooms?.delete(projectId);
      logger.info('User left project room', { userId: socket.userId, projectId });
    });

    // Handle task updates
    socket.on('task:update', (data: { projectId: string; taskId: string; updates: any }) => {
      socket.to(`project:${data.projectId}`).emit('task:updated', {
        taskId: data.taskId,
        updates: data.updates,
        updatedBy: socket.userId,
      });
    });

    // Handle task moves (kanban/scrum)
    socket.on('task:move', (data: { projectId: string; taskId: string; status: string; position?: number }) => {
      socket.to(`project:${data.projectId}`).emit('task:moved', {
        taskId: data.taskId,
        status: data.status,
        position: data.position,
        movedBy: socket.userId,
      });
    });

    // Handle task assignments
    socket.on('task:assign', (data: { projectId: string; taskId: string; userId: string }) => {
      socket.to(`project:${data.projectId}`).emit('task:assigned', {
        taskId: data.taskId,
        userId: data.userId,
        assignedBy: socket.userId,
      });
      // Notify the assigned user
      io.to(`user:${data.userId}`).emit('notification:task-assigned', {
        taskId: data.taskId,
        assignedBy: socket.userId,
      });
    });

    // Handle comments
    socket.on('comment:new', (data: { projectId: string; taskId: string; comment: any }) => {
      socket.to(`project:${data.projectId}`).emit('comment:added', {
        taskId: data.taskId,
        comment: data.comment,
      });
    });

    // Handle sprint updates
    socket.on('sprint:update', (data: { projectId: string; sprintId: string; updates: any }) => {
      socket.to(`project:${data.projectId}`).emit('sprint:updated', {
        sprintId: data.sprintId,
        updates: data.updates,
      });
    });

    // Handle typing indicators
    socket.on('typing:start', (data: { projectId: string; taskId: string }) => {
      socket.to(`project:${data.projectId}`).emit('user:typing', {
        taskId: data.taskId,
        userId: socket.userId,
      });
    });

    socket.on('typing:stop', (data: { projectId: string; taskId: string }) => {
      socket.to(`project:${data.projectId}`).emit('user:stopped-typing', {
        taskId: data.taskId,
        userId: socket.userId,
      });
    });

    // Handle presence
    socket.on('presence:update', (status: 'online' | 'away' | 'busy') => {
      socket.projectRooms?.forEach((projectId) => {
        socket.to(`project:${projectId}`).emit('user:presence', {
          userId: socket.userId,
          status,
        });
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info('Client disconnected', { socketId: socket.id, userId: socket.userId, reason });
      
      // Notify project rooms about user going offline
      socket.projectRooms?.forEach((projectId) => {
        socket.to(`project:${projectId}`).emit('user:presence', {
          userId: socket.userId,
          status: 'offline',
        });
      });
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
}

/**
 * Get Socket.IO instance
 */
export function getIO(): SocketServer {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

/**
 * Emit event to project room
 */
export function emitToProject(projectId: string, event: string, data: any): void {
  if (io) {
    io.to(`project:${projectId}`).emit(event, data);
  }
}

/**
 * Emit event to specific user
 */
export function emitToUser(userId: string, event: string, data: any): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

/**
 * Broadcast notification to user
 */
export function sendNotification(userId: string, notification: any): void {
  emitToUser(userId, 'notification:new', notification);
}

/**
 * Broadcast task update to project
 */
export function broadcastTaskUpdate(projectId: string, taskId: string, updates: any): void {
  emitToProject(projectId, 'task:updated', { taskId, updates });
}

/**
 * Broadcast sprint update to project
 */
export function broadcastSprintUpdate(projectId: string, sprintId: string, updates: any): void {
  emitToProject(projectId, 'sprint:updated', { sprintId, updates });
}

export default {
  initializeSocketServer,
  getIO,
  emitToProject,
  emitToUser,
  sendNotification,
  broadcastTaskUpdate,
  broadcastSprintUpdate,
};
