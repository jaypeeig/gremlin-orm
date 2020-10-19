const gremlin = require('gremlin');
const _ = require('lodash');

class GremlinService {
  constructor(config) {
    const {neptuneEndpoint, neptunePort} = config;
    const {DriverRemoteConnection} = gremlin.driver;
    const {Graph} = gremlin.structure;
    const graph = new Graph();
    const dc = new DriverRemoteConnection(
      `wss://${neptuneEndpoint}:${neptunePort}/gremlin`,
      {mimeType: 'application/vnd.gremlin-v2.0+json'}
    );

    this.dc = dc;
    this.g = graph.traversal().withRemote(this.dc);
  }

  async closeSocket() {
    return this.dc.close();
  }

  async addVertex(label, properties) {
    const vertex = this.g.addV(label);
    _.each(properties, (val, key) => vertex.property(key, val));
    return vertex.valueMap(true).toList();
  }

  async updateVertex(id, properties) {
    const vertex = this.g.V(id);
    _.each(properties, (val, key) => vertex.property(gremlin.process.cardinality.single, key, val));
    return vertex.next();
  }

  async deleteVertex(id) {
    const vertex = this.g.V(id);
    return vertex.drop().next();
  }

  async getVertexById(id, filters) {
    const vertex = this.g.V(id);
    return vertex
      .valueMap(true)
      .toList();
  }

  async getVertexByLabel(label) {
    return this.g.V()
      .hasLabel(label)
      .valueMap(true)
      .toList();
  }

  async addEdge({
    label,
    srcId,
    dstId,
    properties
  }) {
    const edge = this.g
      .V(srcId).as('src')
      .V(dstId).as('dst')
      .addE(label)
      .from_('src')
      .to('dst');

    _.each(properties, (val, key) => edge.property(key, val));
    return edge.valueMap(true).toList();
  }

  async deleteEdge({
    label,
    srcId,
    dstId
  }) {
    return this.g
      .V(srcId)
      .outE(label).as('e')
      .inV()
      .hasId(dstId)
      .select('e')
      .drop()
      .iterate();
  }

  async updateEdge({
    currentLabel,
    newLabel,
    srcId,
    dstId,
    properties
  }) {
    await this.deleteEdge({
      label: currentLabel,
      srcId,
      dstId
    });

    return this.addEdge({
      label: newLabel,
      srcId,
      dstId,
      properties
    });
  }

}

module.exports = GremlinService;
