const mysql = require('mysql')
const express = require('express')
const bodyParser = require('body-parser')

const app = express()

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}))

const server = app.listen(process.env.PORT || 3000, () => {
    console.log('Server lauscht auf Port %s', server.address().port)    
})

var con = mysql.createConnection({
    host: "130.255.124.99",    
    user: "placematman",
    password: "BKB123456!",
    database: "dbPlacemat"
})

con.connect(function(err){
    if (err) console.error(err)
})

app.get('/',function(req,res){    

    console.log("Webseite angefordert")

    con.query("SELECT * from placemat ORDER BY nummer DESC LIMIT 1;", function(err, result1) {
    
        con.query("SELECT TIMESTAMPDIFF(MINUTE, (SELECT zeitstempel from placemat ORDER BY nummer DESC LIMIT 1), now());", function(err, result) {
                
            let anzeige = ["Es gibt kein aktives Placemat, dem Sie beitreten können."]
                        
            // Nur wenn in den letzten 5 Minuten ein Placemat aufgelegt wurde und auch eines existiert ... 

            if(result[0][Object.keys(result[0])[0]] < 5 && result1[0][Object.keys(result1[0])[2]]){
                
                anzeige = ["Neues Placemat: " + result1[0][Object.keys(result1[0])[2]], "Jetzt beitreten!"]                
            
            }
            res.render('index.ejs', {        
                anzeigen: anzeige
            })
        })
    })    
})

app.post('/', function(req,res){    

    console.log("Button geklickt")
    
    // Das letzte Placemat wird herausgesucht

    con.query("SELECT * from placemat ORDER BY nummer DESC LIMIT 1;", function(err, result1) {

        // Eigenschaften des Platzdeckchens ermitteln.

        let anzeigen = []
        let timestamp = result1[0][Object.keys(result1[0])[1]]
        let titel = result1[0][Object.keys(result1[0])[2]]        
        let anzahlGruppen = result1[0][Object.keys(result1[0])[3]]
        let think = result1[0][Object.keys(result1[0])[4]]
        let endeUhrzeitThink = result1[0][Object.keys(result1[0])[5]]
        let pair = result1[0][Object.keys(result1[0])[6]]
        let endeUhrzeitPair = result1[0][Object.keys(result1[0])[7]]
        
        // Die zuerst angemeldeten Schüler werden zum Anlaufpunkt für weitere Schüler.

        // Eigenschaften aller User des Platzdeckchens ermitteln

        con.query("SELECT * from placematuser WHERE titel='" + titel + "';", function(err, result) {
            
            let anzahl = 0
            let gruppe = 0
            var treffpunkt = []

            Object.keys(result).forEach(function(key) {
                var row = result[key];
                console.log(row.name + row.gruppe)
                anzahl++
                gruppe = row.gruppe
                if(anzahl <= anzahlGruppen){
                    treffpunkt.push(row.name)
                }                                
            }) 

            if (gruppe % anzahlGruppen == 0){
                console.log("Modulo: " + anzahlGruppen + "/" + gruppe + " : " + gruppe % anzahlGruppen)
                gruppe = 1
            }else{
                gruppe = gruppe +1
            }
            
            // Wenn die Gruppe undefined ist, dann 

            if(!treffpunkt[gruppe - 1]){ treffpunkt[gruppe - 1] = "Ihnen" }

            console.log(gruppe + "-" + req.body.tbxName + "-" + titel + "-" + treffpunkt[gruppe - 1])
            
            con.query("INSERT INTO placematuser(gruppe, name, titel) VALUES ('" + gruppe + "','" + req.body.tbxName + "','" + titel + "');", function (err, result) {
                anzeigen.push(req.body.tbxName + "! du bist in Gruppe" + gruppe +".")                                                
                anzeigen.push("THINK hat bereits begonnen.")
                anzeigen.push("PAIR ab " + endeUhrzeitThink.toLocaleTimeString('de-DE') + " bei " + treffpunkt[gruppe - 1] + ".")
                anzeigen.push("PAIR endet um " + endeUhrzeitPair.toLocaleTimeString('de-DE') + ".")                
                res.render('index.ejs', {        
                    anzeigen: anzeigen                        
                })        
            })            
        })
    })
})

app.get('/admin',function(req,res){    
    
    console.log("Adminseite angefordert")    
    
    // Placemat Tabelle anlegen, wenn Sie nicht existiert:

    con.query("CREATE TABLE IF NOT EXISTS placemat(nummer INT AUTO_INCREMENT, zeitstempel TIMESTAMP, titel VARCHAR(50), anzahlGruppen INT, dauerThink INT, endeThink DATETIME, dauerPair INT, endePair DATETIME, PRIMARY KEY(nummer));", function (err, result) {
        
        if (err) {
            return console.error('error: ' + err.message);
        }    
        
        // Falls kein Fehler auftritt, wird der Erfolg geloggt.
        
        console.log("Tabelle 'placemat' erfolgreich angelegt, bzw. schon vorhanden.");
    })
    con.query("CREATE TABLE IF NOT EXISTS placematUser(gruppe INT, name VARCHAR(50), titel VARCHAR(50), PRIMARY KEY(name,titel));", function (err, result) {
        
        if (err) {
            return console.error('error: ' + err.message);
        }
        
        // Falls kein Fehler auftritt, wird der Erfolg geloggt.
        
        console.log("Tabelle 'placematUser' erfolgreich angelegt, bzw. schon vorhanden.");
    })

    // Das zuletzt angelegte Placemat wird selektiert

    con.query("SELECT titel from placemat ORDER BY nummer DESC LIMIT 1;", function(err, result1) {
        
        con.query("SELECT * FROM placematUser WHERE titel = '" + result1[0][Object.keys(result1[0])[0]] + "'  ORDER BY gruppe;", function(err, result) {
            console.log("dfsdfsdf" + err)
            res.render('admin.ejs', {        
                placematUser: result
            })
        })
    })    
})

app.post('/admin', function(req,res){    
    
    console.log("Admin-Button geklickt")
    
    con.query("INSERT INTO placemat(titel, zeitstempel, anzahlGruppen, dauerThink, endeThink, dauerPair, endePair) VALUES ('" + req.body.tbxTitel + "', now(), '" + req.body.tbxAnzahlGruppen + "','" + req.body.tbxThink + "', ADDTIME(now(), '0:" + req.body.tbxThink + ":0'),'" + req.body.tbxPair + "', ADDTIME(now(), '0:" + (parseInt(req.body.tbxPair) + parseInt(req.body.tbxThink)) + ":0'));", function (err, result) {
    
        let footnote = "Placemat erfolgreich angelegt: Titel: " + req.body.tbxTitel + " AnzahlGruppen:" + req.body.tbxAnzahlGruppen + " Think:" + req.body.tbxThink + " Pair:" + req.body.tbxPair

        if (err) {
            footnote = err.message
        }
                
        console.log();                
        res.render('admin.ejs', {
            placematUser: null
        })
    });
})