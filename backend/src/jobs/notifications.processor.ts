import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationsProcessor.name);

    async process(job: Job): Promise<void> {
        switch (job.name) {
            case 'task-assigned':
                await this.handleTaskAssigned(job);
                break;
            case 'task-status-changed':
                await this.handleStatusChanged(job);
                break;
            default:
                this.logger.warn(`Unknown job: ${job.name}`);
        }
    }

    private async handleTaskAssigned(job: Job) {
        const { taskId, taskTitle, assignedTo, assignedBy } = job.data;
        // Stub: In production, send email/push notification
        this.logger.log(
            `📧 Notification: Task "${taskTitle}" (${taskId}) assigned to ${assignedTo} by ${assignedBy}`,
        );
    }

    private async handleStatusChanged(job: Job) {
        const { taskId, taskTitle, from, to, changedBy } = job.data;
        // Stub: In production, send email/push notification
        this.logger.log(
            `📧 Notification: Task "${taskTitle}" (${taskId}) status changed ${from} → ${to} by ${changedBy}`,
        );
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job) {
        this.logger.debug(`Job ${job.name}:${job.id} completed`);
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, error: Error) {
        this.logger.error(`Job ${job.name}:${job.id} failed: ${error.message}`);
    }
}
