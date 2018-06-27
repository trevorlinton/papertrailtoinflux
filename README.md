# Papertrail to InfluxDB

This is a simple http service to receive alerts from papertrail and log them into an influx database. 

## Environment

* `INFLUXDB_URL` - This is the url for the influx database as a URI format http://user:pass@hostname:port/database, the host and database is required, if a port, username and password is added they are passed on to influx db.

## Logging Papertrial Alerts

1. Create a search on papertrail 
2. Save the search (this will become the metric name in influx db)
3. Create an alert
4. Add the URL for this app into the URL section
4. Only send counts, make sure this is checked!
5. You may want to change the frequency to 10 minutes or 1 hour, note the frequency does not change the resolution of events, just how soon they get entered into influx.

