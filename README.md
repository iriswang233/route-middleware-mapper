# router-middleware-mapper
> A simple package to map different routes with different middlewares in nodejs project
## Getting started

- [Install](#install)
- [Use](#use)
  - [Policies](#policies)
  - [Configuration](#configuration)
- [Mapping](#mapping)

## Install

```sh
$ npm i -S route-middleware-mapper
```

or

```sh
$ yarn add route-middleware-mapper
```

## Use
After the installation you can import the package to your nodejs project.

### Policies
Create a folder named "policies" in project root.
This "policies" folder contains all middlewares that are used by routes and the mapping configuration file.

For example,
```sh
.
+-- policies
|   +-- config.json
|   +-- isAuthenticated.js
|   +-- isAdmin.js
|   +-- fromClient.js
|   ...
```

All the js files are middlewares. You can have one like this

```sh
const isAuthenticated = (req, res, next) => {
  console.dir('isAuthenticated');
};

module.exports = isAuthenticated;
```

### Configuration
The "config.json" file is used to map routes with middlewares.
For example,
```sh
{
  "/*": ["isAuthenticated"],
  "/health": {
    "/*": true,
    "/test":["isAuthenticated"],
    "/admin": ["isAdmin"]
  },
  "/name": {
    "/userinfo": ["isAdmin"],
    "/testinfo": {
      "/:id": ["fromClient","isAdmin"]
    }
  }
}
```
All the keys means the routes.
  "/*" means all routes with certain path.
  "/xxx" means specific route.  
  "/:" means dynamic route.

All the values means the middlewares that required by the route.
If the value is
  1) string array, it means the route will go through these middlewares one by one. So each string here represents the middleware in "policies" folder, and the order of strings matters.
  2) true, it means this route don't need to go throuth any middlewares.

## Mapping

The route will be mapped to the key that closest to it. But if the specific route is not defined in the file, more general key will be used.

In previous example, 
All routes need to go through "isAuthenticated". So
  1) route "/hello" will go through "isAuthenticated". Because there is no closer key defined here than "/*".
  2) route "/health/info" don't have any middleware. Beacuse its closet route is all routes("/*") with "/health", which its value is "true".
  3) route "/name/role" will go through "isAuthenticated". Beacuse although its closet route is "/name", but neither "/*" nor "/role" is defined under "/name", so it turns to a more general route "/*".
  4) route "/name/testinfo/2" will go through "fromClient" and "isAdmin". Because it matches the "/name/testinfo/:id".




