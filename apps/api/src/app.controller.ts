import { Controller, Get, Post, Put, Delete, Body, Param, Req, UnauthorizedException } from '@nestjs/common';
import { AppService } from './app.service.js';
import { auth } from './auth/auth.js';
import type { Request } from 'express';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  private async getSessionUser(req: Request) {
    const session = await auth.api.getSession({ headers: req.headers as any });
    if (!session || !session.user) throw new UnauthorizedException('Not authenticated');
    return session.user;
  }

  @Post('set-password')
  async setPassword(@Req() req: Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    return this.appService.setPassword(user.id, body.password);
  }

  @Get('dashboard')
  async getDashboardData(@Req() req: Request) {
    const user = await this.getSessionUser(req);
    return this.appService.getDashboardData(user.id);
  }

  @Post('clients')
  async createClient(@Req() req: Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    return this.appService.createClient(user.id, body);
  }

  @Put('clients/:id')
  async updateClient(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const user = await this.getSessionUser(req);
    return this.appService.updateClient(user.id, id, body);
  }

  @Delete('clients/:id')
  async deleteClient(@Req() req: Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    return this.appService.deleteClient(user.id, id);
  }

  @Post('invoices')
  async createInvoice(@Req() req: Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    return this.appService.createInvoice(user.id, body);
  }

  @Put('invoices/:id')
  async updateInvoice(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    const user = await this.getSessionUser(req);
    return this.appService.updateInvoice(user.id, id, body);
  }

  @Delete('invoices/:id')
  async deleteInvoice(@Req() req: Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    return this.appService.deleteInvoice(user.id, id);
  }
}
