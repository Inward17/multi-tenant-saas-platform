import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import * as cookie from 'cookie';
import { AuthService } from '../auth/auth.service';

const adminRoom = (organizationId: string) => `org:${organizationId}:admins`;

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(EventsGateway.name);

    constructor(
        private jwtService: JwtService,
        private authService: AuthService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            // Extract JWT from cookie in handshake
            const cookies = cookie.parse(
                client.handshake.headers.cookie || '',
            );
            const token = cookies['access_token'];

            if (!token) {
                this.logger.warn(`Connection rejected: no token — ${client.id}`);
                client.disconnect();
                return;
            }

            // Validate JWT — never trust client-sent orgId; role/org come from the DB
            const session = await this.authService.validateSession(this.jwtService.verify(token));
            if (!session) {
                this.logger.warn(`Connection rejected: revoked session — ${client.id}`);
                client.disconnect();
                return;
            }
            const { userId, organizationId, role } = session;

            // Attach validated user data to socket
            client.data.userId = userId;
            client.data.organizationId = organizationId;
            client.data.role = role;

            // Join organization room
            const room = `org:${organizationId}`;
            client.join(room);
            // Audit activity is OWNER/ADMIN only, same as GET /audit
            if (role === 'OWNER' || role === 'ADMIN') client.join(adminRoom(organizationId));

            this.logger.log(
                `Connected: userId=${userId} orgId=${organizationId} room=${room} socketId=${client.id}`,
            );
        } catch (err) {
            this.logger.warn(`Connection rejected: invalid token — ${client.id}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data?.userId || 'unknown';
        const orgId = client.data?.organizationId || 'unknown';
        this.logger.log(
            `Disconnected: userId=${userId} orgId=${orgId} socketId=${client.id}`,
        );
    }

    // ─── Broadcast Methods (transport layer only) ───

    broadcastTaskCreated(organizationId: string, task: any) {
        this.server.to(`org:${organizationId}`).emit('taskCreated', task);
    }

    broadcastTaskUpdated(organizationId: string, task: any) {
        this.server.to(`org:${organizationId}`).emit('taskUpdated', task);
    }

    broadcastTaskDeleted(organizationId: string, taskId: string) {
        this.server.to(`org:${organizationId}`).emit('taskDeleted', { id: taskId });
    }

    broadcastActivity(organizationId: string, activity: any) {
        this.server.to(adminRoom(organizationId)).emit('activityCreated', activity);
    }
}
