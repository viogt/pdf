var http  = require('http'),
    fs    = require('fs'),
    Mng   = require('mongodb'),
    MngCl = Mng.MongoClient,
    ObjId = Mng.ObjectID,
    MngIp = 'mongodb://127.0.0.1:27017/test',
    body;

MngIp = 'mongodb://'+process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
	process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
	process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
	process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
	process.env.OPENSHIFT_APP_NAME;

var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
var port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

http.createServer(function (req, res) {

  if(req.method == 'GET') {
    
    if(req.url == '/') returnFile('./index.html', res);
    else if(req.url.substr(0,4)=='/res') returnFile('.' + req.url, res);
    else res.end('Error: unknown request!');
    return;
  }
  
    body = '';
    req.on('data', function (chunk) { body += chunk; });
  
    req.on('end', function () {
        var J = JSON.parse(body);
        J.server = 'OK';
        J.action += ' done!';
        J.modified = new Date();
        res.end( JSON.stringify(J) );
        //operate( J, res );
    });
  
}).listen(port, ipaddress);

function operate( js, resp ) {
    resp.writeHead(200, {'Content-Type': 'text/plain' });
    MngCl.connect(MngIp, function(err, db) {
        if(err) return shucher(resp, err, null);
        var cll = db.collection( js.collection );
        switch( js.action ) {
            case 'get one':
                cll.findOne({file: js.file}, function(err, obj) {
                    if(err) return shucher(resp, err, db); db.close();
                    resp.end(JSON.stringify(obj));
		        });
		        return;
		    case 'list':
                cll.find().sort({modified:-1}).toArray(function(err, recs) {
                    if(err) return shucher(resp, err, db); db.close();
			        resp.end(JSON.stringify(recs));
		        });
		        return;
            case 'save':
                js.modified = new Date();
                cll.update({file: js.file}, js, {upsert: true}, function(err, obj) {
                    if(err) return shucher(resp, err, db); db.close();
			        resp.end(JSON.stringify(obj));
		        });
		        return;
            case 'remove':
                cll.remove( {file: js.file}, function(err, obj) {
                    if(err) return shucher(resp, err, db); db.close();
                    resp.end(JSON.stringify(obj));
                });
		    default: shucher(resp, {error: 'Unknown command'}, db);
        }
    });
}

function returnFile(fl, resp){
    fs.readFile(fl, function (err,data) {
      if (err) return shucher(resp, err);
      resp.writeHead(200, {'Content-Type': 'text/html' });
      resp.end(data);
    });
}

function shucher(res, err, DB) { if(DB != null) DB.close(); res.end('0' + JSON.stringify(err)); return false; }