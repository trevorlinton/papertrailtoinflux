const http = require('http');
const influx = require('influx').InfluxDB;
const url = require('url');
const express = require('express');
const bodyparser = require('body-parser');

const app = express();

console.assert(process.env.INFLUXDB_URL, 'The value INFLUXDB_URL is required.')
let dburi = url.parse(process.env.INFLUXDB_URL)
let config = {database:dburi.pathname.substring(1), host:dburi.hostname}
if(dburi.port) {
  config.port = dburi.port
}
if(dburi.auth) {
  config.username = dburi.auth.split(':')[0]
  config.password = dburi.auth.split(':')[1]
}
console.assert(config.database || config.database === '', 'The database for INFLUXDB_URL was not defined.')
console.assert(config.host || config.host === '', 'The host for the database in INFLUXDB_URL was not defined.')
const influxdb = new influx(config)

influxdb.getDatabaseNames().then((names) => {
  if(!names.includes(config.database)) {
    console.log(`Creating influx database ${config.database}`)
    influxdb.createDatabase(config.database).catch((e) => console.error(e))
  }
})

app.post('/', bodyparser.urlencoded({ extended: false }), (req, res) => {
  try {
    let data = JSON.parse(req.body.payload);
    let name = decodeURIComponent(data.saved_search.name).replace(/ /g, '+');
    let points = [];
    data.counts.forEach((count) => {
      Object.keys(count.timeseries).forEach((series) => {
        points.push({measurement:name, tags:{host:count.source_name}, fields:{count:count.timeseries[series]}, timestamp:series});
      });
    });
    if(process.env.TEST_MODE === "true") {
      console.log("received:", JSON.stringify(data, null, 2));
      console.log("Submitting", points)
      res.send("");
      return
    }
    influxdb.writePoints(points, {database:config.database, retentialPolicy:'4w', precision:'s'}).catch((e) => console.error(e));
    res.send("");
  } catch (e) {
    console.error(e);
    res.send("");
  }
});

app.listen(process.env.PORT || 9000)