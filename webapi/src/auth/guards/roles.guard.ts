import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../../database/entities/user-role.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        return true;
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();

        if (!user || !user.roles) {
            // If user is not present or roles are not loaded, deny access
            // NOTE: Ensure your auth strategy loads the user AND their roles
            return false;
        }

        return requiredRoles.some((role) => user.roles.some((userRole) => userRole.role === role));
    }
}
