const { process } = require('gremlin');
const GremlinORM = require('./gorm');
const config = {
    neptuneEndpoint: process.env.NEPTUNE_ENDPOINT || '',
    neptunePort: process.env.NEPTUNE_PORT || 8182
};
const gremlinService = new GremlinORM(config);

async function test(){
    const testObject = {name: 'Foo Bar', age: 17};
    const response = await gremlinService.addVertex('Person', testObject);
    //always close the socket after the traversal
    await gremlinService.closeSocket();
    return response;
}

const node = await test();
console.log(node);
