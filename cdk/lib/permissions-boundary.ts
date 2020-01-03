import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');

export class PermissionsBoundary implements cdk.IAspect {
  private readonly permissionsBoundaryArn: string;

  constructor(permissionBoundaryArn: string) {
    this.permissionsBoundaryArn = permissionBoundaryArn;
  }

  public visit(node: cdk.IConstruct): void {
    if (node instanceof iam.Role) {
        const roleResource = node.node.findChild('Resource') as iam.CfnRole;
        roleResource.addPropertyOverride('PermissionsBoundary', this.permissionsBoundaryArn);
    }
  }
}
