const { PlacematUser } = require("./PlacematUser");
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

const dbVerbindung = mysql.createConnection({
    host: "130.255.124.99", user: "placematman", password: "BKB123456!", database: "dbPlacemat"
})

dbVerbindung.connect()

app.get('/',(req,res) => {    

    dbVerbindung.query("SELECT thema from placemat;", (err, rows, fields) => {        

        res.render('index.ejs', {        

            anzeigen: [rows[0].thema, "Jetzt beitreten!"]
        })
    })    
})

app.post('/', (req,res) => {    
    dbVerbindung.query("SELECT * from placemat;", (err, rows, fields) => {
        let placematUsers = []   
        let thema = rows[0].thema        
        let anzahlGruppen = rows[0].anzahlGruppen
        let endeUhrzeitThink = rows[0].endeUhrzeitThink
        let endeUhrzeitPair = rows[0].endeUhrzeitPair
               
        dbVerbindung.query("SELECT * from placematuser;", (err, rows, fileds) => {         
            if (err) throw err
            for (let row of rows) {                
                let placematUser = new PlacematUser()
                placematUser.name = row.name
                placematUser.gruppe = row.gruppe                
                placematUser.treffpunkt = row.treffpunkt

                if(row.name === req.body.tbxName){
                    let anzeigen = []
                    anzeigen.push("Hoppla, " + placematUser.name + "!")
                    anzeigen.push("Es existiert bereits ein User mit diesem Namen!")
                    anzeigen.push("Hier nochmal die Zugangsdaten für " + placematUser.name + ":")
                    anzeigen.push("Du bist in der " + placematUser.gruppe + ". Gruppe ")
                    anzeigen.push("THINK hat bereits begonnen.")
                    anzeigen.push("PAIR ab " + ("0" + endeUhrzeitThink.getHours()).slice(-2) +":" + ("0" + endeUhrzeitThink.getMinutes()).slice(-2) + " Uhr bei " + placematUser.treffpunkt + ".")
                    anzeigen.push("PAIR endet um " + ("0" + endeUhrzeitPair.getHours()).slice(-2) +":" + ("0" + endeUhrzeitPair.getMinutes()).slice(-2) + " Uhr.")                
                    anzeigen.push("Viel Spaß :-)")  
                    res.render('index.ejs', {        
                        anzeigen: anzeigen
                    }) 
                    return
                }

                placematUsers.push(placematUser)
            }

            let placematUser = new PlacematUser()
            placematUser.name = req.body.tbxName
            placematUser.thema = thema

            if(placematUsers.length === 0 || !(placematUsers.length % anzahlGruppen)){        
                placematUser.gruppe = 1
            }else{
                placematUser.gruppe = placematUsers[placematUsers.length - 1].gruppe + 1                
            }
            
            if(anzahlGruppen > placematUsers.length){
                placematUser.treffpunkt = placematUser.name
            }else{
                for(i = 0; i < anzahlGruppen; i++){
                    if(placematUsers[i].gruppe === placematUser.gruppe){
                        placematUser.treffpunkt = placematUsers[i].treffpunkt
                    }
                }                
            }

            dbVerbindung.query("INSERT INTO placematuser(gruppe, name, thema, treffpunkt) VALUES ('" + placematUser.gruppe + "','" + placematUser.name + "','" + placematUser.thema + "','" + placematUser.treffpunkt + "');", (err, result) => {
                let anzeigen = []
                anzeigen.push("Hallo " + placematUser.name + "!")
                anzeigen.push("Du bist in der " + placematUser.gruppe + ". Gruppe ")
                anzeigen.push("THINK hat bereits begonnen.")
                anzeigen.push("PAIR ab " + ("0" + endeUhrzeitThink.getHours()).slice(-2) +":" + ("0" + endeUhrzeitThink.getMinutes()).slice(-2) + " Uhr bei " + placematUser.treffpunkt + ".")
                anzeigen.push("PAIR endet um " + ("0" + endeUhrzeitPair.getHours()).slice(-2) +":" + ("0" + endeUhrzeitPair.getMinutes()).slice(-2) + " Uhr.")                
                anzeigen.push("Viel Spaß :-)")                
                res.render('index.ejs', {        
                    anzeigen: anzeigen                        
                })        
            })    
        })
    })
})

app.get('/admin', (req,res) => {    
        
    dbVerbindung.query("CREATE TABLE IF NOT EXISTS placemat(nummer INT AUTO_INCREMENT, zeitstempel TIMESTAMP, thema VARCHAR(50), anzahlGruppen INT, dauerThink INT, endeUhrzeitThink DATETIME, dauerPair INT, endeUhrzeitPair DATETIME, PRIMARY KEY(nummer));", (err, result) => {
        
        if (err) throw err
                
        console.log("Tabelle 'placemat' erfolgreich angelegt, bzw. schon vorhanden.");
    })

    dbVerbindung.query("CREATE TABLE IF NOT EXISTS placematUser(gruppe INT, name VARCHAR(50), thema VARCHAR(50), treffpunkt VARCHAR(50), PRIMARY KEY(name,thema));", (err, result) => {
        
        if (err) {
            return console.error('error: ' + err.message);
        }
        
        // Falls kein Fehler auftritt, wird der Erfolg geloggt.
        
        console.log("Tabelle 'placematUser' erfolgreich angelegt, bzw. schon vorhanden.");
    })

    // Das zuletzt angelegte Placemat wird selektiert

    dbVerbindung.query("SELECT thema from placemat;", (err, rows, fields) => {

        if(!rows.length){                
            res.render('admin.ejs', {        
                placematUser: null
            })
        }else{                       
            dbVerbindung.query("SELECT * FROM placematUser WHERE thema = '" + rows[0].thema + "'  ORDER BY gruppe;", (err, result) => {            
                
                res.render('admin.ejs', {
                    thema: "Mein Placemat",
                    anzahlGruppen: 3,
                    dauerThink: 5,
                    dauerPair: 5,
                    absenden: "absenden",
                    placematUser: result
                })
            })
        }        
    })    
})

app.post('/admin', (req,res) => {    
    
    console.log("Admin-Button geklickt")
    
    dbVerbindung.query("DELETE FROM placemat;", (err, result) => {        
        if (err) throw err        
    })

    dbVerbindung.query("DELETE FROM placematUser;", (err, result) => {
        if (err) throw err        
    })

    dbVerbindung.query("INSERT INTO placemat(thema, zeitstempel, anzahlGruppen, dauerThink, endeUhrzeitThink, dauerPair, endeUhrzeitPair) VALUES ('" + req.body.tbxThema + "', now(), '" + req.body.tbxAnzahlGruppen + "','" + req.body.tbxThink + "', ADDTIME(now(), '0:" + req.body.tbxThink + ":0'),'" + req.body.tbxPair + "', ADDTIME(now(), '0:" + (parseInt(req.body.tbxPair) + parseInt(req.body.tbxThink)) + ":0'));", (err, result) => {
    
        let footnote = "Placemat erfolgreich angelegt: Thema: " + req.body.tbxThema + " AnzahlGruppen:" + req.body.tbxAnzahlGruppen + " Think:" + req.body.tbxThink + " Pair:" + req.body.tbxPair

        if (err) {
            footnote = err.message
        }                
                     
        res.render('admin.ejs', {
            thema: req.body.tbxThema,
            anzahlGruppen: req.body.tbxAnzahlGruppen,
            dauerThink: req.body.tbxThink,
            dauerPair: req.body.tbxPair,
            absenden: "ok",
            placematUser: null
        })
    });
})