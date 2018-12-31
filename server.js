const { PlacematUser } = require("./PlacematUser");
const express = require('express')
const app = express()
app.set('view engine', 'ejs')
app.use(express.static('public'))
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: true}))
const server = app.listen(process.env.PORT || 3000, () => {
    console.log('Server lauscht auf Port %s', server.address().port)    
})

const mysql = require('mysql')
const dbVerbindung = mysql.createConnection({
    host: "130.255.124.99", 
    user: "placematman", 
    password: "BKB123456!", 
    database: "dbPlacemat"
})

dbVerbindung.connect()

app.get('/',(req, res, next) => {    
    dbVerbindung.query("SELECT * from placemat;", (err, rows) => { 
        if (err) return next(err)       

        if(rows[0] === undefined){
            res.render('index.ejs', {                    
                anzeigen: ["Zur Zeit kein aktives Placemat"],
                endeUhrzeitNachdenken: new Date(),
                endeUhrzeitVergleichen: new Date(),
                endeUhrzeitKonsens: new Date()       
            })
        }else{
            res.render('index.ejs', {                    
                anzeigen: [rows[0].thema, "Jetzt beitreten!"],
                endeUhrzeitNachdenken: rows[0].endeUhrzeitNachdenken,
                endeUhrzeitVergleichen: rows[0].endeUhrzeitVergleichen,
                endeUhrzeitKonsens: rows[0].endeUhrzeitKonsens       
            })
        }        
    })    
})

app.post('/', (req, res, next) => {    
    
    dbVerbindung.query("SELECT * from placemat;", (err, rows) => {
        if (err) return next(err)
        let placematUsers = []   
        let thema = rows[0].thema        
        let anzahlGruppen = rows[0].anzahlGruppen
        let endeUhrzeitNachdenken = rows[0].endeUhrzeitNachdenken
        let endeUhrzeitVergleichen = rows[0].endeUhrzeitVergleichen
        let endeUhrzeitKonsens = rows[0].endeUhrzeitKonsens
               
        dbVerbindung.query("SELECT * from placematuser;", (err, rows) => {         
            if (err) return next(err)
            for (let row of rows) {                
                let placematUser = new PlacematUser()
                placematUser.name = row.name
                placematUser.gruppe = row.gruppe                
                placematUser.treffpunkt = row.treffpunkt

                if(row.name === req.body.tbxName){
                    let anzeigen = [placematUser.name + ", Du bist bereits angemeldet."]                    
                    anzeigen.push("Hier nochmal für Dich:")
                    anzeigen.push("Ab sofort:")
                    anzeigen.push("NACHDENKEN UND SCHREIBEN: Du sollst über Dein Thema nachdenken und Notizen aufschreiben.") 
                    anzeigen.push(("0" + endeUhrzeitNachdenken.getHours()).slice(-2) +":" + ("0" + endeUhrzeitNachdenken.getMinutes()).slice(-2) + " Uhr bei " + placematUser.treffpunkt + ":") 
                    anzeigen.push("VERGLEICHEN: Du liest die Notizen derjenigen, die sich mit Dir bei " + placematUser.treffpunkt + " treffen.")
                    anzeigen.push(("0" + endeUhrzeitVergleichen.getHours()).slice(-2) +":" + ("0" + endeUhrzeitVergleichen.getMinutes()).slice(-2) + " Uhr bei " + placematUser.treffpunkt + ":") 
                    anzeigen.push("TEILEN UND KONSENS FINDEN mit all denen, die sich mit Dir bei " + placematUser.treffpunkt + " eingefunden haben.")
                    anzeigen.push(("0" + endeUhrzeitKonsens.getHours()).slice(-2) +":" + ("0" + endeUhrzeitKonsens.getMinutes()).slice(-2) + " Uhr im Plenum:")
                    anzeigen.push("PÄSENTATION. Viel Spaß :-)")  
                    res.render('index.ejs', {        
                        anzeigen: anzeigen,
                        endeUhrzeitNachdenken: endeUhrzeitNachdenken,
                        endeUhrzeitVergleichen: endeUhrzeitVergleichen,
                        endeUhrzeitKonsens: endeUhrzeitKonsens       
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
                placematUser.treffpunkt = (placematUsers.filter((p) => p.gruppe === placematUser.gruppe))[0].treffpunkt                
            }

            dbVerbindung.query("INSERT INTO placematuser(gruppe, name, thema, treffpunkt) VALUES ('" + placematUser.gruppe + "','" + placematUser.name + "','" + placematUser.thema + "','" + placematUser.treffpunkt + "');", (err, result) => {
                if (err) return next(err)
                let anzeigen = ["Hallo " + placematUser.name + "!"]
                anzeigen.push("Du bist in der " + placematUser.gruppe + ". Gruppe ") 
                anzeigen.push("Ab sofort:")
                anzeigen.push("NACHDENKEN UND SCHREIBEN: Du sollst über Dein Thema nachdenken und Notizen aufschreiben.") 
                anzeigen.push(("0" + endeUhrzeitNachdenken.getHours()).slice(-2) +":" + ("0" + endeUhrzeitNachdenken.getMinutes()).slice(-2) + " Uhr bei " + placematUser.treffpunkt + ":") 
                anzeigen.push("VERGLEICHEN: Du liest die Notizen derjenigen, die sich mit Dir bei " + placematUser.treffpunkt + " treffen.")
                anzeigen.push(("0" + endeUhrzeitVergleichen.getHours()).slice(-2) +":" + ("0" + endeUhrzeitVergleichen.getMinutes()).slice(-2) + " Uhr " + placematUser.treffpunkt + ":") 
                anzeigen.push("TEILEN UND KONSENS FINDEN mit all denen, die sich mit Dir bei " + placematUser.treffpunkt + " eingefunden haben.")
                anzeigen.push(("0" + endeUhrzeitKonsens.getHours()).slice(-2) +":" + ("0" + endeUhrzeitKonsens.getMinutes()).slice(-2) + " Uhr im Plenum:")
                anzeigen.push("PÄSENTATION. Viel Spaß :-)")                
                res.render('index.ejs', {        
                    anzeigen: anzeigen,    
                    endeUhrzeitNachdenken: endeUhrzeitNachdenken,
                    endeUhrzeitVergleichen: endeUhrzeitVergleichen,
                    endeUhrzeitKonsens: endeUhrzeitKonsens       
                })        
            })    
        })
    })
})

app.get('/admin', (req, res,next) => {    
    dbVerbindung.query("CREATE TABLE IF NOT EXISTS placemat(nummer INT AUTO_INCREMENT, zeitstempel TIMESTAMP, thema VARCHAR(50), anzahlGruppen INT, dauerNachdenken INT, endeUhrzeitNachdenken DATETIME, dauerVergleichen INT, endeUhrzeitVergleichen DATETIME, dauerKonsens INT, endeUhrzeitKonsens DATETIME, PRIMARY KEY(nummer));", (err) => {
        if (err) return next(err)         
                
        console.log("Tabelle 'placemat' erfolgreich angelegt, bzw. schon vorhanden.");
    })

    dbVerbindung.query("CREATE TABLE IF NOT EXISTS placematUser(gruppe INT, name VARCHAR(50), thema VARCHAR(50), treffpunkt VARCHAR(50), PRIMARY KEY(name,thema));", (err) => {        
        if (err) return next(err)         
        
        // Falls kein Fehler auftritt, wird der Erfolg geloggt.
        
        console.log("Tabelle 'placematUser' erfolgreich angelegt, bzw. schon vorhanden.");
    })

    dbVerbindung.query("CREATE TABLE IF NOT EXISTS users(username VARCHAR(50), password VARCHAR(50), PRIMARY KEY(username));", (err) => {        
        if (err) return next(err)         
        
        // Falls kein Fehler auftritt, wird der Erfolg geloggt.
        
        console.log("Tabelle 'users' erfolgreich angelegt, bzw. schon vorhanden.");
    })

    // Das zuletzt angelegte Placemat wird selektiert
    
    dbVerbindung.query("SELECT * from placemat;", (err, rows) => {
        if (err) return next(err)         

        // Wenn es kein Placemat gibt:

        if(!rows.length){      
            
            console.log("Standardwerte anzeigen, weil es noch kein Placemat gibt")
            
            res.render('admin.ejs', {        
                anzeigen: [],
                thema: "Mein Platzdeckchen",
                anzahlGruppen: 3,
                dauerNachdenken: 5,
                dauerVergleichen: 5,
                dauerKonsens: 5,
                absenden: "absenden",
                placematUser: null
            })
        }else{                       

            let endeUhrzeitNachdenken = rows[0].endeUhrzeitNachdenken
            let endeUhrzeitVergleichen = rows[0].endeUhrzeitVergleichen
            let endeUhrzeitKonsens = rows[0].endeUhrzeitKonsens

            dbVerbindung.query("SELECT * FROM placematUser WHERE thema = '" + rows[0].thema + "'  ORDER BY gruppe;", (err, result) => {            
                if (err) return next(err)
                
                let anzeigen = []            
                anzeigen.push("Ab sofort:")
                anzeigen.push("NACHDENKEN UND SCHREIBEN: Jeder soll über sein Thema nachdenken und Notizen aufschreiben.") 
                anzeigen.push(("0" + endeUhrzeitNachdenken.getHours()).slice(-2) +":" + ("0" + endeUhrzeitNachdenken.getMinutes()).slice(-2) + " Uhr in der jeweiligen Gruppe:") 
                anzeigen.push("VERGLEICHEN: Jeder liest die Notizen derjenigen, die mit ihr / ihm in der Gruppe sind.")
                anzeigen.push(("0" + endeUhrzeitVergleichen.getHours()).slice(-2) +":" + ("0" + endeUhrzeitVergleichen.getMinutes()).slice(-2) + " Uhr:") 
                anzeigen.push("TEILEN UND KONSENS FINDEN mit all denen, die mit ihr / ihm in der Gruppe sind")
                anzeigen.push(("0" + endeUhrzeitKonsens.getHours()).slice(-2) +":" + ("0" + endeUhrzeitKonsens.getMinutes()).slice(-2) + " Uhr:")
                anzeigen.push("PÄSENTATION.") 

                console.log(rows[0].thema)

                res.render('admin.ejs', {
                    anzeigen: anzeigen,
                    thema: rows[0].thema,
                    anzahlGruppen: rows[0].anzahlGruppen,
                    dauerNachdenken: rows[0].dauerNachdenken,
                    dauerVergleichen: rows[0].dauerVergleichen,
                    dauerKonsens: rows[0].dauerKonsens,
                    absenden: "Placemat aktiv!",
                    placematUser: result
                })
            })
        }        
    })                
})

app.post('/admin', (req, res, next) => {    
    
    console.log("Admin-Button geklickt")
    
    dbVerbindung.query("SELECT COUNT(*) AS anzahl FROM users WHERE (username = '" + req.body.tbxUsername + "') AND (password = '" + req.body.tbxPassword + "');", (err,rows) => {                     
        if (err) return next(err)

        if (rows[0].anzahl === 1){

            dbVerbindung.query("DELETE FROM placemat;", (err) => {        
                if (err) return next(err)
            })
        
            dbVerbindung.query("DELETE FROM placematUser;", (err) => {
                if (err) return next(err)
            })

            dbVerbindung.query("INSERT INTO placemat(thema, zeitstempel, anzahlGruppen, dauerNachdenken, endeUhrzeitNachdenken, dauerVergleichen, endeUhrzeitVergleichen, dauerKonsens, endeUhrzeitKonsens) VALUES ('" + req.body.tbxThema + "', now(), '" + req.body.tbxAnzahlGruppen + "','" + req.body.tbxNachdenken + "', ADDTIME(now(), '0:" + req.body.tbxNachdenken + ":0'),'" + req.body.tbxVergleichen + "', ADDTIME(now(), '0:" + (parseInt(req.body.tbxVergleichen) + parseInt(req.body.tbxNachdenken)) + ":0'),'" + req.body.tbxKonsens + "', ADDTIME(now(), '0:" + (parseInt(req.body.tbxVergleichen) + parseInt(req.body.tbxNachdenken) + parseInt(req.body.tbxKonsens)) + ":0'));", (err) => {                     
                
                if (err) return next(err)
        
                res.render('admin.ejs', {            
                    anzeigen: [],
                    thema: req.body.tbxThema,
                    anzahlGruppen: req.body.tbxAnzahlGruppen,
                    dauerNachdenken: req.body.tbxNachdenken,
                    dauerVergleichen: req.body.tbxVergleichen,
                    dauerKonsens: req.body.tbxKonsens,
                    absenden: "Platzdeckchen aktiv!",
                    placematUser: null
                })
            })    
        }else{
            console.log("Hallo1")
            return next(new Error("Du hast keine Berechtigung dies zu tun!"))
        }
    })
})

app.use((err, req, res, next) => {            
    res.render('error.ejs', {        
        error:["F E H L E R", err.message, "Falls Du nicht automatisch weitergeleitet wirst, dann ...", "Seite neu laden, um fortzufahren."]
    }) 
});
