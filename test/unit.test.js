const {expect} = require('chai');
const mockPolicies = require('./policies/config.json');
const rewire = require("rewire");

describe('mapping index', () => {
  let transformPolicies, getMiddlewares, mappingModule, getPoliciesHandles;
  beforeEach(() => {
    mappingModule = rewire('../index.js');
    mappingModule.__set__('pathName',`./test/policies`);
    mappingModule.__set__('policiesConfig',require(`./policies/config.json`));
    transformPolicies = mappingModule.__get__('transformPolicies');
    getMiddlewares = mappingModule.__get__('getMiddlewares');
    getPoliciesHandles = mappingModule.__get__('getPoliciesHandles');
  });
  describe('get policies handles from policies folder', () => {
    it('should get correct number of handles', () => {
      const handles = getPoliciesHandles();
      expect(handles).to.have.all.keys('isAdmin','isAuthenticated');
    })
  })
  describe('transform policies', () => {
    it('should combine dynamic path into one', () => {
      const transformedPolicies = transformPolicies(mockPolicies);
      expect(transformedPolicies).to.have.property('/:');
      expect(transformedPolicies['/:']).to.have.all.keys('/*', '/info', '/role', '/userinfo','/testinfo','/:id');
    })
  });
  describe('get middlewares for the requested path', () => {
    it('should return mapped middlewares when the request path exists', () => {
      const middlewares = getMiddlewares('/result/testinfo/loadingtest', mockPolicies);
      expect(middlewares).to.be.an('array').to.have.lengthOf(1).that.includes('isAdmin');
    })
    it('should return default middlewares of the parent path when the request path does not exist', () => {
      const middlewares = getMiddlewares('/hello', mockPolicies);
      expect(middlewares).to.equal(true);
    })
  });
});
