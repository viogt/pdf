var http  = require('http'),
    fs    = require('fs'),
    Mng   = require('mongodb'),
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
        try {
            var J = JSON.parse(body);
            operate( J, res );
        } catch(e) { shucher(res, {error: 'Bad request/json'}, null); }
/*
        J.server = 'OK';
        J.action += ' done!';
        J.modified = new Date();
        res.end( JSON.stringify(J) );
*/
    });
  
}).listen(port, ipaddress);

function operate( js, resp ) {
    resp.writeHead(200, {'Content-Type': 'text/plain' });
    Mng.MongoClient.connect(MngIp, function(err, db) {
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
                cll.find({}, { file:1, modified:1 }).sort({modified:-1}).toArray(function(err, recs) {
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
		        return;
            case 'rename':
                cll.update({ _id: new Mng.ObjectID(js.id) }, {$set: { file: js.file, modified: new Date() }}, function(err, obj) {
                    if(err) return shucher(resp, err, db); db.close();
			        resp.end(JSON.stringify(obj));
		        });
		        return;
            case 'download':
                cll.findOne({file: js.file}, function(err, obj) {
                    if(err) return shucher(resp, err, db); db.close();
	                resp.writeHead(200, {'Content-disposition': 'attachment; filename='+obj.file});
                    var html = '<HTML><HEAD><TITLE>' + obj.file + '</TITLE><STYLE>' + obj.theme + '</STYLE></HEAD>';
	                html += '<BODY>' + obj.content + '</BODY></HTML>';
                    resp.end(html);
		        });
		        return;
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