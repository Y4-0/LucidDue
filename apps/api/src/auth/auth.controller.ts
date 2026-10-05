import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';

@Controller('api/auth')
export class AuthController {
  @All('/*path')
  async handler(@Req() req: Request, @Res() res: Response) {
    const nodeHandler = toNodeHandler(auth);
    return nodeHandler(req, res);
  }
}
