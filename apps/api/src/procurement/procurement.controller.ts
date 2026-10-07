import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProcurementService } from './procurement.service';

@Controller('procurement')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProcurementController {
  constructor(private readonly procurement: ProcurementService) {}

  private actor(req: any) {
    return {
      id: req.user.id as string,
      role: req.user.role as string,
      orgId: req.user.orgId as string,
    };
  }

  private ip(req: any) {
    return req.ip || '127.0.0.1';
  }

  @Get('work')
  getMyWork(@Request() req: any) {
    return this.procurement.myWork(this.actor(req));
  }

  @Get('requests')
  @Roles('ADMIN', 'BUYER')
  listRequests(@Request() req: any) {
    return this.procurement.listRequests(this.actor(req));
  }

  @Post('requests')
  @Roles('ADMIN', 'BUYER')
  createRequest(@Request() req: any, @Body() body: any) {
    return this.procurement.createRequest(this.actor(req), body, this.ip(req));
  }

  @Post('requests/:id/submit')
  @Roles('ADMIN', 'BUYER')
  submitRequest(@Request() req: any, @Param('id') id: string) {
    return this.procurement.submitRequest(this.actor(req), id, this.ip(req));
  }

  @Post('requests/:id/decision')
  @Roles('ADMIN')
  decideRequest(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { approved: boolean; reason?: string },
  ) {
    return this.procurement.decideRequest(
      this.actor(req),
      id,
      Boolean(body.approved),
      body.reason || '',
      this.ip(req),
    );
  }

  @Post('requests/:id/source')
  @Roles('ADMIN', 'BUYER')
  createProject(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { method: string; title?: string },
  ) {
    return this.procurement.createProject(this.actor(req), id, body, this.ip(req));
  }

  @Post('projects/:id/events')
  @Roles('ADMIN', 'BUYER')
  createEvent(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.procurement.createEvent(this.actor(req), id, body, this.ip(req));
  }

  @Get('events')
  listEvents(@Request() req: any) {
    return this.procurement.listEvents(this.actor(req));
  }

  @Get('events/:id')
  getEvent(@Request() req: any, @Param('id') id: string) {
    return this.procurement.getEvent(this.actor(req), id);
  }

  @Post('events/:id/publish')
  @Roles('ADMIN', 'BUYER')
  publishEvent(@Request() req: any, @Param('id') id: string) {
    return this.procurement.publishEvent(this.actor(req), id, this.ip(req));
  }

  @Post('events/:id/invitations')
  @Roles('ADMIN', 'BUYER')
  inviteSupplier(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { supplierOrgId: string },
  ) {
    return this.procurement.inviteSupplier(
      this.actor(req),
      id,
      body.supplierOrgId,
      this.ip(req),
    );
  }

  @Post('events/:id/clarifications')
  @Roles('VENDOR')
  askClarification(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { question: string },
  ) {
    return this.procurement.askClarification(
      this.actor(req),
      id,
      body.question,
      this.ip(req),
    );
  }

  @Post('clarifications/:id/answer')
  @Roles('ADMIN', 'BUYER')
  answerClarification(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { answer: string },
  ) {
    return this.procurement.answerClarification(
      this.actor(req),
      id,
      body.answer,
      this.ip(req),
    );
  }

  @Post('events/:id/amendments')
  @Roles('ADMIN', 'BUYER')
  amendEvent(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.procurement.amendEvent(this.actor(req), id, body, this.ip(req));
  }

  @Post('events/:id/responses')
  @Roles('VENDOR')
  submitResponse(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.procurement.submitResponse(this.actor(req), id, body, this.ip(req));
  }

  @Post('events/:id/open')
  @Roles('ADMIN', 'BUYER')
  openEvent(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { note?: string },
  ) {
    return this.procurement.openEvent(this.actor(req), id, body?.note, this.ip(req));
  }

  @Post('events/:id/assignments')
  @Roles('ADMIN', 'BUYER')
  assignReviewer(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { responseId: string; reviewerId: string },
  ) {
    return this.procurement.assignReviewer(
      this.actor(req),
      id,
      body.responseId,
      body.reviewerId,
      this.ip(req),
    );
  }

  @Post('assignments/:id/conflict')
  @Roles('REVIEWER')
  declareConflict(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { conflict: boolean; note?: string },
  ) {
    return this.procurement.declareConflict(this.actor(req), id, body, this.ip(req));
  }

  @Post('assignments/:id/scorecard')
  @Roles('REVIEWER')
  submitScorecard(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.procurement.submitScorecard(this.actor(req), id, body, this.ip(req));
  }

  @Post('events/:id/award')
  @Roles('ADMIN', 'BUYER')
  recommendAward(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { responseId: string; rationale: string },
  ) {
    return this.procurement.recommendAward(
      this.actor(req),
      id,
      body.responseId,
      body.rationale,
      this.ip(req),
    );
  }

  @Post('awards/:id/decision')
  @Roles('ADMIN')
  decideAward(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { approved: boolean },
  ) {
    return this.procurement.approveAward(
      this.actor(req),
      id,
      Boolean(body.approved),
      this.ip(req),
    );
  }

  @Post('awards/:id/contract')
  @Roles('ADMIN', 'BUYER')
  createContract(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.procurement.createContract(this.actor(req), id, body, this.ip(req));
  }

  @Post('contracts/:id/execute')
  @Roles('ADMIN', 'BUYER')
  executeContract(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { signedDocumentKey: string },
  ) {
    return this.procurement.executeContract(
      this.actor(req),
      id,
      body.signedDocumentKey,
      this.ip(req),
    );
  }

  @Get('reviewers')
  @Roles('ADMIN', 'BUYER')
  listReviewers() {
    return this.procurement.listReviewers();
  }

  @Get('suppliers')
  @Roles('ADMIN', 'BUYER')
  listSuppliers() {
    return this.procurement.listSuppliers();
  }

  @Post('suppliers/:id/qualifications')
  @Roles('ADMIN')
  qualifySupplier(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.procurement.qualifySupplier(this.actor(req), id, body, this.ip(req));
  }
}
