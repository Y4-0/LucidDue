import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(userId: string) {
    const clients = await this.prisma.client.findMany({ where: { userId } });
    const invoices = await this.prisma.invoice.findMany({ 
      where: { userId },
      include: { client: true },
      orderBy: { dueDate: 'asc' }
    });

    const activeClients = clients.length;
    let totalOutstanding = 0;
    let dueThisWeek = 0;
    let overdueInvoices = 0;

    const now = new Date();
    // Reset time for accurate date comparison
    now.setHours(0,0,0,0);
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingInvoices: any[] = [];
    const actionNeededInvoices: any[] = [];

    invoices.forEach(inv => {
      if (inv.status === 'PENDING' || inv.status === 'OVERDUE') {
        totalOutstanding += inv.amount;
        const due = new Date(inv.dueDate);
        due.setHours(0,0,0,0);

        if (due < now) {
          overdueInvoices++;
          actionNeededInvoices.push(inv);
        } else {
          upcomingInvoices.push(inv);
          if (due <= oneWeekFromNow) {
            dueThisWeek += inv.amount;
          }
        }
      }
    });

    return {
      metrics: {
        totalOutstanding,
        dueThisWeek,
        overdueInvoices,
        activeClients
      },
      clients,
      upcomingInvoices: upcomingInvoices.slice(0, 5),
      actionNeededInvoices: actionNeededInvoices.slice(0, 5)
    };
  }

  async createClient(userId: string, data: any) {
    return this.prisma.client.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company,
        notes: data.notes,
        userId
      }
    });
  }

  async updateClient(userId: string, id: string, data: any) {
    return this.prisma.client.update({
      where: { id, userId },
      data: {
        name: data.name,
        email: data.email,
        company: data.company,
        notes: data.notes,
      }
    });
  }

  async deleteClient(userId: string, id: string) {
    return this.prisma.client.delete({
      where: { id, userId }
    });
  }

  async createInvoice(userId: string, data: any) {
    return this.prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        amount: parseFloat(data.amount),
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        notes: data.notes,
        clientId: data.client,
        userId
      }
    });
  }
  async updateInvoice(userId: string, id: string, data: any) {
    return this.prisma.invoice.update({
      where: { id, userId },
      data: {
        invoiceNumber: data.invoiceNumber,
        amount: parseFloat(data.amount),
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        notes: data.notes,
        clientId: data.client,
      }
    });
  }

  async deleteInvoice(userId: string, id: string) {
    return this.prisma.invoice.delete({
      where: { id, userId }
    });
  }
}
