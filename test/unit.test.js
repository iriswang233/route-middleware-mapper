const mockPolicies = require('./policies/config.json');
const rewire = require("rewire");
const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const expect = chai.expect;
chai.use(sinonChai);

describe('mapping index', () => {
  let transformPolicies, getMiddlewares, mappingModule,
    getPoliciesHandles, executeMiddlewares, getPoliciesConfig;
  const policiesPath = require("path").join(__dirname, 'policies');
  const emptyPoliciesPath = require("path").join(__dirname, 'empty_policies');
  const emptyPath = require("path").join(__dirname, 'empty');

  beforeEach(() => {
    mappingModule = rewire('../index.js');
    transformPolicies = mappingModule.__get__('transformPolicies');
    getMiddlewares = mappingModule.__get__('getMiddlewares');
    getPoliciesHandles = mappingModule.__get__('getPoliciesHandles');
    executeMiddlewares = mappingModule.__get__('executeMiddlewares');
    getPoliciesConfig = mappingModule.__get__('getPoliciesConfig');
    const pathMock = {
      join:(rootParentPath, middlePath, policiesPath) => {
        return policiesPath;
      }  
    };
    mappingModule.__set__(
      'path',pathMock
    );
  });
  describe('get policies handles from policies folder', () => {
    it('should get correct number of handles', () => {
      const handles = getPoliciesHandles(policiesPath);
      expect(handles).to.have.all.keys('isAdmin','isAuthenticated','isUser');
    })
    it('should get null if the folder does not exists', () => {
      const handles = getPoliciesHandles('');
      expect(handles).to.equal(null);
    })
    it('should get null if the folder is empty', () => {
      const handles = getPoliciesHandles(emptyPath);
      expect(handles).to.equal(null);
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
      expect(transformedPolicies['/:']).to.have.all.keys('/info', '/role', '/userinfo','/testinfo');
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
    it('should return defined middlewares when the request path exist', () => {
      const middlewares = getMiddlewares('/health/test', mockPolicies);
      expect(middlewares).to.be.an('array').to.have.lengthOf(1).that.includes('isAuthenticated');
    })
  });
  describe('get correct config', () => {
    it('should return null if the config file does not exist', () => {
      const config = getPoliciesConfig(emptyPath);
      expect(config).to.equal(null);
    })
    it('should return correct if the config file exists', () => {
      const config = getPoliciesConfig(policiesPath);
      expect(config).to.be.an('object');
    })
  });
  describe('execute correct middlewares', () => {
    let handles, getPoliciesHandles;
    beforeEach(() => {
      handles = {
        isAuthenticated: sinon.spy(),
        isAdmin: sinon.spy(),
        isUser: sinon.spy()
      }
      getPoliciesHandles = () => ({
        ...handles
      });
      mappingModule.__set__(
      'getPoliciesHandles',getPoliciesHandles
      );
    });
    it('should only call next() if the the config does not exists', () => {
      const nextSpy = sinon.spy();
      const req = {
        path:'/test'
      };
      executeMiddlewares(emptyPath)(req, {}, nextSpy);
      expect(handles.isAuthenticated).to.have.callCount(0);
      expect(handles.isAdmin).to.have.callCount(0);
      expect(nextSpy.calledOnce).to.be.true;
    });

    it('should only call next() if the mapped middlewares are empty', function() {
      const nextSpy = sinon.spy();
      const req = {
        path:'/health/hello'
      };
      executeMiddlewares(policiesPath)(req, {}, nextSpy);
      expect(handles.isAuthenticated).to.have.callCount(0);
      expect(handles.isAdmin).to.have.callCount(0);
      expect(nextSpy.calledOnce).to.be.true;
    });
    it('should not call the middleware if it is not defined in folder', async () => {
      const nextSpy = sinon.spy();
      const req = {
        path:'/test/role'
      };
      await executeMiddlewares(policiesPath)(req, {}, nextSpy);
      expect(handles.isAdmin).to.have.been.calledOnce;
      expect(nextSpy).to.have.been.calledOnce.and.calledAfter(handles.isAdmin);
    });
    it('should break the middleware chain if the response is sent in one response', async () => {
      const nextSpy = sinon.spy();
      const req = {
        path:'/1/info'
      };
      await executeMiddlewares(policiesPath)(req, {headersSent: true}, nextSpy);
      expect(nextSpy.calledOnce).to.be.false;
    });
    it('should call policy middlewares one by one', async () => {
      const nextSpy = sinon.spy();
      const req = {
        path:'/reporter/testinfo/info'
      };
      await executeMiddlewares(policiesPath)(req, {}, nextSpy);
      expect(handles.isAuthenticated).to.have.been.calledOnce;
      expect(handles.isAdmin).to.have.been.calledOnce.and.calledAfter(handles.isAuthenticated);
      expect(nextSpy).to.have.been.calledOnce.and.calledAfter(handles.isAdmin);
    });
  });
  describe(('not execute any middlewares if mapper config does not exist'), () => {
    it('should call next() once if the the policies does not exists', async () => {
      const nextSpy = sinon.spy();
      const req = {
        path:'/test'
      };
      await executeMiddlewares(emptyPoliciesPath)(req, {}, nextSpy);
      expect(nextSpy.calledOnce).to.be.true;
    });
  });
});
