# permask integrations

## Examples:

Here is a list of integrations permask with popular frameworks.

### Express.js Middleware
 
```ts
import {permaskExpress, PermissionAccess} from "permask";
import {groups} from "./permission-group"; // your defined groups

// Create a middleware
// Options object is optional, just for customization
const checkPermission = permaskExpress(groups, {
    /**
     * Use to setup where you store permissions in the request object.
     * Don't use if you're overring getPermissions function
     */
    permissionsKey: "user.permissions",
    /**
     * Use it, if you want custom loogic to get permissions array
     */
    getPermissions: ({permissionsKey}, req) => {
        return req.session?.user?.permissions || [];
    },
    /**
     * Use it, if you want to customize the response when the user doesn't have permission
     */
    forbiddenResponse: (res) => {
        res.status(403).send("You don't have permission to access this route");
    }
});

// to check permission for a route
app.get("/protected", checkPermissions(groups.admin, PermissionAccess.READ), (req, res) => {
    res.send("protected route");
});
```

