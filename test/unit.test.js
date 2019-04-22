const {expect} = require('chai');
const mockPolicies = require('./policies/config.json');
const rewire = require("rewire");
const sinon  = require('sinon');

describe('mapping index', () => {
  let transformPolicies, getMiddlewares, mappingModule, getPoliciesHandles, executeMiddlewares;
  beforeEach(() => {
    mappingModule = rewire('../index.js');
    mappingModule.__set__('pathName',`./test/policies`);
    mappingModule.__set__('policiesConfig',require(`./policies/config.json`));
    transformPolicies = mappingModule.__get__('transformPolicies');
    getMiddlewares = mappingModule.__get__('getMiddlewares');
    getPoliciesHandles = mappingModule.__get__('getPoliciesHandles');
    executeMiddlewares = mappingModule.__get__('executeMiddlewares');
  });
  describe('get policies handles from policies folder', () => {
    it('should get correct number of handles', () => {
      const handles = getPoliciesHandles();
      expect(handles).to.have.all.keys('isAdmin','isAuthenticated');
    })
  })
  describe('transform policies', () => {
    it('should copy fixed path', () => {
      const policies = {
        '/*':['isAuthenticated'],
        '/health': []
      };
      const transformedPolicies = transformPolicies(policies);
      expect(transformedPolicies).to.have.all.keys('/*','/health');
    })   
    it('should combine dynamic path into one', () => {
      const transformedPolicies = transformPolicies(mockPolicies);
      expect(transformedPolicies).to.have.property('/:');
      expect(transformedPolicies['/:']).to.have.all.keys('/info', '/role', '/userinfo','/testinfo','/:id');
    })
  });
  describe('get middlewares for the requested path', () => {
    it('should return middlewares for all routes if the path is empty', () => {
      const middlewares = getMiddlewares('', mockPolicies);
      expect(middlewares).to.be.an('array').to.have.lengthOf(1).that.includes('isAuthenticated', 'isAdmin');
    })
    it('should return mapped middlewares when the request path exists', () => {
      const middlewares = getMiddlewares('/result/user/loadingtest', mockPolicies);
      expect(middlewares).to.be.an('array').to.have.lengthOf(1).that.includes('isAuthenticated');
    })
    it('should return middlewares for all routes when the request path not exists', () => {
      const middlewares = getMiddlewares('', mockPolicies);
      expect(middlewares).to.be.an('array').to.have.lengthOf(1).that.includes('isAuthenticated');
    })
    it('should return default middlewares of the parent path when the request path does not exist', () => {
      const middlewares = getMiddlewares('/health/user', mockPolicies);
      expect(middlewares).to.be.an('array').to.have.lengthOf(0);
    })
  });
  describe('execute correct middlewares', () => {
    it('should call next() once', function() {
      const nextSpy = sinon.spy();
      const req = {
        path:'/test'
      };
      executeMiddlewares(req, {}, nextSpy);
      expect(nextSpy.calledOnce).to.be.true;
    });
    it('should call policy middlewares one by one', function() {
      const nextSpy = sinon.spy();
      const req = {
        path:'/reporter/testinfo/info'
      };
      executeMiddlewares(req, {}, nextSpy);
      expect(nextSpy.calledOnce).to.be.true;
    });
  });
});
