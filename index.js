const path = require("path");
const fs = require("fs");

const getPoliciesHandles = (normalizedPath) => {
  let allHandles = null;
  if(fs.existsSync(normalizedPath)) {
    fs.readdirSync(normalizedPath).forEach(function(file) {
      if(!file.includes('.json') && file.includes('.js')) {
        allHandles = Object.assign({},require(`${normalizedPath}/${file}`),allHandles);
      }
    });
  }
  return allHandles;
}

const transformPolicies = (policies) => {
  let newPolicies = {};
  Object.keys(policies).forEach(path => {
    if(path.includes(':')){
      newPolicies['/:'] = newPolicies['/:']? Object.assign({},policies[path],newPolicies['/:']) : policies[path];
    } else {
      newPolicies[path] = Array.isArray(policies[path])? policies[path] : Object.assign({},policies[path],newPolicies[path]);
    }
  })
  return newPolicies;
}

const getMiddlewares = (path, policies) => {
  const pathArray = path.split('/');
  let transformedPolicies = policies;
  let middlewares = transformedPolicies['/*'];
  let currentPath = policies;
  if(pathArray.length > 1) {
    for(let i = 1 ; i < pathArray.length; i ++) {
      transformedPolicies = transformPolicies(currentPath);
      currentPath = transformedPolicies;
      let testPath = currentPath[`/${pathArray[i]}`];
      if (!testPath) {
        // dynamic route exists
        if(currentPath['/:']){
          testPath = currentPath['/:'];
        }
      }
      if(testPath){
        currentPath = testPath;
        if(Array.isArray(currentPath)){
          middlewares = currentPath;
          break;
        } else {
          middlewares = currentPath['/*'] ? currentPath['/*'] : middlewares;
        }
      }
    }
  }
  return middlewares;
}
const getPoliciesConfig = (normalizedPath)=>{
  const configJsonPath = `${normalizedPath}/config.json`;
  let policiesConfig = null;
  if(fs.existsSync(configJsonPath)) {
    policiesConfig = require(configJsonPath);
  }
  return policiesConfig;
}

const executeMiddlewares = (normalizedPath) => (req, res, next) => {
  const policiesConfig = getPoliciesConfig(normalizedPath);
  if(policiesConfig) {
    const middlewares = getMiddlewares(req.path, policiesConfig);
    if(middlewares.length > 0) {
      const handles = getPoliciesHandles(normalizedPath);
      if(handles) {
        for (let i = 0 ; i < middlewares.length; i ++) {
          if(handles[middlewares[i]]) {
            handles[middlewares[i]](req, res);
          }
        }
      }
    }
  }
  next();
}
module.exports = executeMiddlewares;
