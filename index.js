const http = require('http');
const influx = require('influx').InfluxDB;
const url = require('url')

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

const server = http.createServer((req, res) => {
	let data = Buffer.alloc(0);
	req.on('data', (chunk) => {
		data = Buffer.concat([data, chunk])
	})
	req.on('end', () => {
		try {
			data = data.toString('utf8')
			data = data.substring('payload='.length)
			data = JSON.parse(decodeURIComponent(data))
			let name = decodeURIComponent(data.saved_search.name).replace(/ /g, '+')
			let points = []
			data.counts.forEach((count) => {
				Object.keys(count.timeseries).forEach((series) => {
					points.push({measurement:name, tags:{host:count.source_name}, fields:{count:count.timeseries[series]}, timestamp:series})
				})
			})
			influxdb.writePoints(points, {database:config.database, retentialPolicy:'4w', precision:'s'}).catch((e) => console.error(e))
			res.writeHead(200, {'content-type':'text/plain'})
			res.end('')
		} catch (e) {
			console.error(e)
			res.writeHead(500, {})
			res.end('Internal Server Error')
		}
	});
});
server.listen(9000, () => console.log('Listening on 9000'));
