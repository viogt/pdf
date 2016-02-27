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

    if(req.url.charAt(0) == '/') {
        if(req.url.slice(-5)!='.json') returnStream('.'+req.url, res);
        else returnFile('.'+req.url, res);
            /*var j = require('.'+req.url);
            res.writeHead(200, {'Content-Type': 'application/json;'});
            res.end( JSON.stringify(j) );
            return;
        }*/
        return;
    }
    else {
        try {
            var x = JSON.parse(decodeURI(req.url.substr(1)));
            res.end('GET Action: ' + x.action + ' --- ' + JSON.stringify(x));
        } catch(e) { }
    }
    return;

  }
    body = '';
    req.on('data', function (chunk) { body += chunk; });
    req.on('end', function () { saveFile('./res/tables.json',body, res); });

}).listen(port, ipaddress);

function returnStream(fl, resp){ var file = fs.createReadStream(fl); file.pipe(resp); }

function returnFile(fl, resp) { var file = fs.createReadStream(fl); file.setEncoding('utf8'); file.pipe(resp); }
/*{
	fs.readFile(fl, { "encoding":"utf8" },  function (err,data) {
	  if (err) {
		  resp.writeHead(200, { "Content-Type": "text/plain" });
		  resp.end('0Error retreiving the file ' + fl + '...'); return;
	  }
	  resp.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
	  resp.end(data, 'utf8');
  });
}*/

function saveFile( fl, bd, resp ){
	fs.writeFile(fl, bd, 'utf-8', function(err) {
	  if (err) {
		  resp.writeHead(200, {'Content-Type': 'text/plain' });
		  resp.end('0Error writing the file.'); return;
	  }
	  resp.writeHead(200, {'Content-Type': 'text/plain' });
	  resp.end('OK');
  });
}

function operate( Rqst, resp ) {
    var js = JSON.parse(Rqst);
    //resp.writeHead(200, {'Content-Type': 'text/plain' });
    Mng.MongoClient.connect(MngIp, function(err, db) {
        if(err) { resp.end('0 Database cannot be opened!'); return; }
        
        db.collection(js.collection, {strict:true}, function(err, collection) {
        var cll = collection, collExists = err?false:true;
        switch( js.action ) {
            case 'get':
                if(!collExists) { resp.end('null'); db.close(); return; }
                cll.findOne({_id: js._id}, function(err, obj) { sc(obj, err, resp, db); });
		        return;
            case 'save':
                js.modified = new Date();
                db.collection(js.collection).update({_id: js._id}, js, {upsert: true}, function(err, obj) { sc(obj, err, resp, db); });
		        return;
		    default: resp.end('0 Unknown command'); db.close();
        }
        });
    });
}

function sc(obj, err, res, DB) {
    res.end(err?('0' + JSON.stringify(err)):JSON.stringify(obj));
    DB.close();
}