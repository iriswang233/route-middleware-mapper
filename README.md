# router-middleware-mapper
[![Build Status](https://travis-ci.com/iriswang233/route-middleware-mapper.svg?branch=master)](https://travis-ci.org/iriswang233/route-middleware-mapper) [![Coverage Status](https://coveralls.io/repos/github/iriswang233/route-middleware-mapper/badge.svg?branch=master)](https://coveralls.io/github/iriswang233/route-middleware-mapper?branch=master)

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
After the installation you can require the package to your nodejs project.
For example,
```sh
const express = require('express');
const app = express();
const routeMiddlewareMapper = require('route-middleware-mapper')
app.use (routeMiddlewareMapper('./policies')); #This path should be valid and contains a config.json and some middleware js files.

app.use(routes);
...

```

### Policies
Create a folder named "policies" in project root.
This "policies" folder contains all middlewares that are used by routes and the mapping configuration file.
Other folder can be use too, if it follows the structure.
Please remember DO pass the path of this folder when this library is used.(See the example above).

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
const isAuthenticated = (req, res) => {
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
    "/*": [],
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
  "/*" means all routes.
  "/xxx" means a specific route.  
  "/:" means dynamic route.

The values should be string array which contains the middlewares that required by the route. So each string here represents the middleware in "policies" folder, and the order of strings matters.

## Mapping

The route will be mapped to the key that closest to it. But if the specific route is not defined in the file, more general key will be used.

In previous example, 
  1) All routes need to go through "isAuthenticated". 
  2) route "/hello" will go through "isAuthenticated". Because there is no closer key defined here than "/*".
  3) route "/health/info" don't have any middlewares. Beacuse its closet route is all routes("/*") under "/health", which its value is "true".
  4) route "/name/role" will go through "isAuthenticated". Beacuse although its closet route is "/name", but neither "/*" nor "/role" is defined under "/name", so it turns to a more general route "/*".
  5) route "/name/testinfo/2" will go through "fromClient" and "isAdmin". Because it matches the "/name/testinfo/:id".


## Contribution

1. Fork it!
2. Create your feature branch: `git checkout -b feature-branch`
3. Commit your changes: `git commit -am 'Some message to describe the changes'`
4. Push to the branch: `git push origin feature-branch`
5. Submit a pull request
