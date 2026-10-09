import { Body, Controller, ForbiddenException, Get, HttpCode, Post, Query } from '@nestjs/common';
import { CallerId, CallerRole, type Role } from '@app/config';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto.js';
import { MarkSeenDto } from './dto/mark-seen.dto.js';
import { NotificationService } from './notification.service.js';

function requireAdmin(role: Role) {
  if (role !== 'HR_ADMIN') throw new ForbiddenException('Only HR admins can see notifications');
}

@Controller()
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get('notifications')
  list(@CallerId() adminId: string, @CallerRole() role: Role, @Query() { limit }: ListNotificationsQueryDto) {
    requireAdmin(role);
    return this.notifications.list(adminId, limit);
  }

  @Post('notifications/seen')
  @HttpCode(200)
  markSeen(@CallerId() adminId: string, @CallerRole() role: Role, @Body() { seenUntil }: MarkSeenDto) {
    requireAdmin(role);
    return this.notifications.markSeen(adminId, seenUntil);
  }
}
