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
import {
  parseAmendment,
  parseAwardDecision,
  parseAwardRecommendation,
  parseClarification,
  parseClarificationAnswer,
  parseConflictDeclaration,
  parseCreateContract,
  parseCreateEvent,
  parseCreateProject,
  parseCreateRequest,
  parseExecuteContract,
  parseOpening,
  parsePerformanceReview,
  parseQualification,
  parseRequestDecision,
  parseResponse,
  parseReviewerAssignment,
  parseScorecard,
  parseSupplierInvitation,
} from './procurement.contracts';

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
  getMyWork(@Request() req: any): Promise<unknown> {
    return this.procurement.myWork(this.actor(req));
  }

  @Get('requests')
  @Roles('ADMIN', 'BUYER')
  listRequests(@Request() req: any): Promise<unknown> {
    return this.procurement.listRequests(this.actor(req));
  }

  @Post('requests')
  @Roles('ADMIN', 'BUYER')
  createRequest(@Request() req: any, @Body() body: unknown): Promise<unknown> {
    return this.procurement.createRequest(this.actor(req), parseCreateRequest(body), this.ip(req));
  }

  @Post('requests/:id/submit')
  @Roles('ADMIN', 'BUYER')
  submitRequest(@Request() req: any, @Param('id') id: string): Promise<unknown> {
    return this.procurement.submitRequest(this.actor(req), id, this.ip(req));
  }

  @Post('requests/:id/decision')
  @Roles('ADMIN')
  decideRequest(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    const input = parseRequestDecision(body);
    return this.procurement.decideRequest(
      this.actor(req),
      id,
      input.approved,
      input.reason || '',
      this.ip(req),
    );
  }

  @Post('requests/:id/source')
  @Roles('ADMIN', 'BUYER')
  createProject(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.procurement.createProject(
      this.actor(req),
      id,
      parseCreateProject(body),
      this.ip(req),
    );
  }

  @Post('projects/:id/events')
  @Roles('ADMIN', 'BUYER')
  createEvent(@Request() req: any, @Param('id') id: string, @Body() body: unknown): Promise<unknown> {
    return this.procurement.createEvent(this.actor(req), id, parseCreateEvent(body), this.ip(req));
  }

  @Get('events')
  listEvents(@Request() req: any): Promise<unknown> {
    return this.procurement.listEvents(this.actor(req));
  }

  @Get('events/:id')
  getEvent(@Request() req: any, @Param('id') id: string): Promise<unknown> {
    return this.procurement.getEvent(this.actor(req), id);
  }

  @Post('events/:id/publish')
  @Roles('ADMIN', 'BUYER')
  publishEvent(@Request() req: any, @Param('id') id: string): Promise<unknown> {
    return this.procurement.publishEvent(this.actor(req), id, this.ip(req));
  }

  @Post('events/:id/invitations')
  @Roles('ADMIN', 'BUYER')
  inviteSupplier(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    const input = parseSupplierInvitation(body);
    return this.procurement.inviteSupplier(
      this.actor(req),
      id,
      input.supplierOrgId,
      this.ip(req),
    );
  }

  @Post('events/:id/clarifications')
  @Roles('VENDOR')
  askClarification(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    const input = parseClarification(body);
    return this.procurement.askClarification(
      this.actor(req),
      id,
      input.question,
      this.ip(req),
    );
  }

  @Post('clarifications/:id/answer')
  @Roles('ADMIN', 'BUYER')
  answerClarification(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    const input = parseClarificationAnswer(body);
    return this.procurement.answerClarification(
      this.actor(req),
      id,
      input.answer,
      this.ip(req),
    );
  }

  @Post('events/:id/amendments')
  @Roles('ADMIN', 'BUYER')
  amendEvent(@Request() req: any, @Param('id') id: string, @Body() body: unknown): Promise<unknown> {
    return this.procurement.amendEvent(this.actor(req), id, parseAmendment(body), this.ip(req));
  }

  @Post('events/:id/responses')
  @Roles('VENDOR')
  submitResponse(@Request() req: any, @Param('id') id: string, @Body() body: unknown): Promise<unknown> {
    return this.procurement.submitResponse(this.actor(req), id, parseResponse(body), this.ip(req));
  }

  @Post('events/:id/open')
  @Roles('ADMIN', 'BUYER')
  openEvent(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    const input = parseOpening(body);
    return this.procurement.openEvent(this.actor(req), id, input.note, this.ip(req));
  }

  @Post('events/:id/assignments')
  @Roles('ADMIN', 'BUYER')
  assignReviewer(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    const input = parseReviewerAssignment(body);
    return this.procurement.assignReviewer(
      this.actor(req),
      id,
      input.responseId,
      input.reviewerId,
      this.ip(req),
    );
  }

  @Post('assignments/:id/conflict')
  @Roles('REVIEWER')
  declareConflict(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.procurement.declareConflict(
      this.actor(req),
      id,
      parseConflictDeclaration(body),
      this.ip(req),
    );
  }

  @Post('assignments/:id/scorecard')
  @Roles('REVIEWER')
  submitScorecard(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.procurement.submitScorecard(
      this.actor(req),
      id,
      parseScorecard(body),
      this.ip(req),
    );
  }

  @Post('events/:id/award')
  @Roles('ADMIN', 'BUYER')
  recommendAward(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    const input = parseAwardRecommendation(body);
    return this.procurement.recommendAward(
      this.actor(req),
      id,
      input.responseId,
      input.rationale,
      this.ip(req),
    );
  }

  @Post('awards/:id/decision')
  @Roles('ADMIN')
  decideAward(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    const input = parseAwardDecision(body);
    return this.procurement.approveAward(
      this.actor(req),
      id,
      input.approved,
      this.ip(req),
    );
  }

  @Post('awards/:id/contract')
  @Roles('ADMIN', 'BUYER')
  createContract(@Request() req: any, @Param('id') id: string, @Body() body: unknown): Promise<unknown> {
    return this.procurement.createContract(this.actor(req), id, parseCreateContract(body), this.ip(req));
  }

  @Post('contracts/:id/execute')
  @Roles('ADMIN', 'BUYER')
  executeContract(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    const input = parseExecuteContract(body);
    return this.procurement.executeContract(
      this.actor(req),
      id,
      input.signedDocumentKey,
      this.ip(req),
    );
  }

  @Get('reviewers')
  @Roles('ADMIN', 'BUYER')
  listReviewers(): Promise<unknown> {
    return this.procurement.listReviewers();
  }

  @Get('analytics')
  @Roles('ADMIN', 'BUYER')
  analytics(@Request() req: any): Promise<unknown> {
    return this.procurement.analytics(this.actor(req));
  }

  @Get('contracts/:id/export')
  @Roles('ADMIN', 'BUYER')
  exportContract(@Request() req: any, @Param('id') id: string): Promise<unknown> {
    return this.procurement.exportContract(this.actor(req), id);
  }

  @Post('contracts/:id/performance')
  @Roles('ADMIN', 'BUYER')
  createPerformanceReview(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.procurement.createPerformanceReview(
      this.actor(req),
      id,
      parsePerformanceReview(body),
      this.ip(req),
    );
  }

  @Get('integrations/outbox')
  @Roles('ADMIN')
  listOutbox(@Request() req: any): Promise<unknown> {
    return this.procurement.listOutbox(this.actor(req));
  }

  @Get('suppliers')
  @Roles('ADMIN', 'BUYER')
  listSuppliers(): Promise<unknown> {
    return this.procurement.listSuppliers();
  }

  @Get('suppliers/:id')
  @Roles('ADMIN', 'BUYER')
  getSupplierProfile(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<unknown> {
    return this.procurement.getSupplierProfile(this.actor(req), id);
  }

  @Post('suppliers/:id/qualifications')
  @Roles('ADMIN')
  qualifySupplier(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.procurement.qualifySupplier(
      this.actor(req),
      id,
      parseQualification(body),
      this.ip(req),
    );
  }
}
