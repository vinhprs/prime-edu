import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';
import { RoleOutput } from '../dtos';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[] | undefined>(
      'roles',
      [
        context.getHandler(), // Method Roles
        context.getClass(), // Controller Roles
      ],
    );
    if (!roles) {
      return true;
    }

    let request: Request;
    if (context.getType<GqlContextType>() === 'graphql') {
      const ctx = GqlExecutionContext.create(context).getContext();
      request = <Request>ctx.req;
    } else {
      request = context.switchToHttp().getRequest<Request>();
    }

    const { user } = request;
    if (!user) {
      return false;
    }

    return user.roles.some((role: RoleOutput) => {
      if (roles && roles.length) {
        return roles.includes(role.roleName);
      }
      return false;
    });
  }
}
