
const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')

const app = express()

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}))

const con = mysql.createConnection({
    host: "130.255.124.99",    
    user: "placematman",
    password: "BKB123456!",
    database: "dbPlacemat"
})

con.connect(function(err){

    if (err) throw err

    console.log("Erfolgreich mit der Datenbank verbunden.")

    con.query("SELECT * from placemat ORDER BY nummer DESC LIMIT 1;", function(err, result1) {
        
        if (err) throw err;
        
        // Falls kein Fehler auftritt, wird der Erfolg geloggt.
        
        console.log("Tabelle 'taetigkeit' erfolgreich angelegt, bzw. schon vorhanden.");
    })
})


const server = app.listen(process.env.PORT || 3000, () => {
    console.log('Server lauscht auf Port %s', server.address().port)    
})

app.get('/',function(req,res){    

let anzeige = ["Hallo", "Du"]

    res.render('index.ejs', {        
        anzeigen: [anzeige]    
    })
    
})

