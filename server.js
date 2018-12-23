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

app.get('/',function(req,res){    

let anzeige = ["Hallo", "Du"]

    res.render('index.ejs', {        
        anzeigen: [anzeige]    
    })
    
})

