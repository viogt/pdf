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
    else if(req.url.substr(0,5)=='/hash') mongoHash(req.url.substr(6),res);
    else if(req.url == '/list') mongoList(res);
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
    });
  
}).listen(port, ipaddress);

console.log('\n\t<...Working on 8080...>\n');

function mongoInsert(resp){
	MngCl.connect(MngIp, function(err, db) {
    if (err) return shucher(resp, err);

		var cll = db.collection('clls');
		var doc = JSON.parse(body);
		doc.date = new Date();
		
		cll.update({name: doc.name},doc,{upsert: true},function(err, obj) {
      if (err) return shucher(resp, err);
			db.close();
			resp.writeHead(200, {'Content-Type': 'text/plain' });
			resp.end(JSON.stringify(obj));
		});
	});
}

function mongoList(resp){
	MngCl.connect(MngIp, function(err, db) {
    if (err) return shucher(resp, err);
		var cll = db.collection('clls');
		var recs = cll.find().sort({date:-1}).toArray(function(err, recs) {
      if (err) return shucher(resp, err);
			db.close();
      resp.writeHead(200);
      for(var i=0, L=recs.length; i<L; i++)
        if(recs[i].hasOwnProperty('hash')) { delete recs[i].hash; recs[i].hasHash = true; }
        else recs[i].hasHash = false;
			resp.end(JSON.stringify(recs));
		});
	});
}

function mongoHash(ref,resp){
	MngCl.connect(MngIp, function(err, db) {
    if (err) return shucher(resp, err);
		var doc = { _id: new ObjId(unescape(ref)) };
		var cll = db.collection('clls');

		var recs = cll.findOne(doc,function(err, obj) {
      if (err) return shucher(resp, err);
			db.close();
      resp.writeHead(200);
			resp.end(JSON.stringify(obj));
		});
	});
}

function mongoRemove(resp){
	MngCl.connect(MngIp, function(err, db) {

    if (err) return shucher(resp, err);
		var doc, x = JSON.parse(body);
		
		if(x.length<2) doc = { _id: new ObjId(x[0]) }
		else {
		  for(var i in x) x[i] = new ObjId(x[i]);
		  doc = { _id: {"$in":x} };
		}

		var cll = db.collection('clls');
		var recs = cll.remove(doc,function(err, obj) {
      if (err) return shucher(resp, err);
			db.close();
			resp.writeHead(200, {'Content-Type': 'text/plain' });
			resp.end(JSON.stringify(obj));
		});
	});
}

function returnFile(fl, resp){
    fs.readFile(fl, function (err,data) {
      if (err) return shucher(resp, err);
      resp.writeHead(200, {'Content-Type': 'text/html' });
      resp.end(data);
    });
}

function shucher(res, err) {
  var r = JSON.stringify(err);
  console.log(r);
  res.writeHead(200, {'Content-Type': 'text/plain' });
  res.end('0');
  return r;
}