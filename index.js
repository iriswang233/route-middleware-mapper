const pathName = "policies";

const getPoliciesHandles = () => {
  let allHandles = {};
  const normalizedPath = require("path").join(__dirname, pathName);
  const fs = require("fs");
  fs.readdirSync(normalizedPath).forEach(function(file) {
    if(!file.includes('.json') && file.includes('.js')) {
      allHandles[file.replace('.js','')] = require(`./${pathName}/` + file);
    }
  });
  return allHandles;
}

const transformPolicies = (policies) => {
  let newPolicies = {};
  Object.keys(policies).forEach(path => {
    if(path.includes(':')){
      newPolicies['/:'] = newPolicies['/:']? Object.assign({},policies[path],newPolicies['/:']):policies[path];
    } else {
      newPolicies[path] = Object.assign({},policies[path],newPolicies[path]);
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

const executeMiddlewares = (req, res, next) => {
  const policiesConfig = require(`./${pathName}/config.json`);
  const middlewares = getMiddlewares(req.path,policiesConfig);
  const handles = getPoliciesHandles();
  for (let i = 0 ; i < middlewares.length; i ++) {
    handles[middlewares[i]](req, res);
  }
  next();
}
module.exports = executeMiddlewares;
