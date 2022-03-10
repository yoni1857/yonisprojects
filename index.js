const ipbox = document.getElementById("ip")
const unamebox = document.getElementById("username")
const passbox = document.getElementById("password")
const loginform = document.getElementById("loginform")
const mainpage = document.getElementById("mainpage")
const messagelist = document.getElementById("messagelist")
const msginput = document.getElementById("msginput")
var socket = null;
var token = null;
var timerID = 0; 

mainpage.style.visibility = "hidden";

function keepAlive() { 
    var timeout = 5000;  
    if (socket.readyState == socket.OPEN) {  
        socket.send('PING');  
    }  
    timerID = setTimeout(keepAlive, timeout); 
}

function cancelKeepAlive() {  
    if (timerID) {  
        clearTimeout(timerID);  
    }  
}

function resetCookie(cookie) {
    document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure`;
}

function createCookie(cookie, value) {
    document.cookie = `${cookie}=${value}; SameSite=Lax; Secure`;
}

function getCookie(cookie) {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith(`${cookie}=`))
        .split('=')[1];
}

function checkACookieExists(cookie) {
    return (document.cookie.split(';').some((item) => item.trim().startsWith(`${cookie}=`))) 
}

if (checkACookieExists("server") && checkACookieExists("token"))
{
    ipbox.value = getCookie("server")
    login()
}

function login(){
    socket = checkACookieExists("server") ? new WebSocket("wss://"+getCookie("server")) : new WebSocket("wss://"+ipbox.value.replace("ws://","").replace("wss://", ""))
    socket.onmessage = onMessage;
    socket.onopen = function (e) {
        if(checkACookieExists("token")) {
            socket.send(`TOKEN_LOGIN ${getCookie("token")}`)
        } 
        else
        {
            socket.send(`LOGIN ${unamebox.value} ${passbox.value}`)
        }
        keepAlive();
    }

    socket.onclose = function (e) {
        alert("Connection terminated.")
        mainpage.style.visibility = "hidden";
        loginform.style.visibility = "visible";
        tm = null;
        cancelKeepAlive();
    }
}

function handleMessage(message){
    if (message["content"].length > 0) {
        const div = ('color' in message["author"]) ? 
        `<div class="messageitem" style="border-left: 5px ${message["author"]["color"]} solid;">
            <h1 style="color: ${message["author"]["color"]};" >${message["author"]["username"]} at ${new Date(message["date"]+" UTC").toLocaleString()}</h1>
            <p>${message["content"]}</p>
        </div>
        ` : `
        <div class="messageitem">
            <h1>${message["author"]["username"]} at ${new Date(message["date"]+" UTC").toLocaleString()}</h1>
            <p>${message["content"]}</p>
        </div>
        `

        messagelist.innerHTML+=div
        messagelist.scrollTop = messagelist.scrollHeight
    }

    hljs.initHighlighting();
}

let lastkey;

msginput.addEventListener("keyup", function(event) {
    if (event.code === "Enter" && lastkey !== "Shift" && msginput.value !== "") {
        send();
    }
});

msginput.addEventListener("keydown", function(event){
    if (event.key !== "Enter")
        lastkey = event.key;
})

function send(){
    if (msginput.value !== "\n" && msginput.value !== "")
        socket.send(`SEND ${token} ${msginput.value.replace('\n', '<br>')}`)
        msginput.value = ""
}

function onMessage(e){
    var message = e.data
    var splitmessage = message.split(' ')
    console.log(message)
    switch (splitmessage[0]) {
        case "TOKEN":
            resetCookie("token")
            resetCookie("server")
            if(splitmessage[1] !== "NULL"){
                token = splitmessage[1]
                createCookie("token", token)
                createCookie("server", ipbox.value)
                loginform.style.visibility = "hidden";
                mainpage.style.visibility = "visible";
                socket.send("GET "+ token)
            } else { alert("Login failed."); socket = null }
            break
        case "MSGS":
            messagelist.innerHTML = ""
            var jsons = message.substring(message.indexOf(' ') + 1)
            console.log(jsons)
            
            var json = JSON.parse(jsons)
            for (var i = 0; i < json.length; i++){
                handleMessage(json[i])
            }
            messagelist.innerHTML+='<div class="messageitem" style="text-align: center;"><h1>~~last 100 messages~~</h1></div>'
            break
        case "MSG":
            var jsons = message.substring(message.indexOf(' ') + 1)
            console.log(jsons)
            handleMessage(JSON.parse(jsons))
            break
    }
}


function showip(){
    if (document.getElementById('ip').style.display == "none") {
        document.getElementById('ip').style.display = "block";
        document.getElementById('showip').innerHTML = "Hide IP";
    } else {
        document.getElementById('ip').style.display = "none";
        document.getElementById('showip').innerHTML = "Show IP";
    }
}

function passwordShow(){
    if (document.getElementById('password').type == "password")
        document.getElementById('password').type = "text";
}

function passwordHide(){
    if (document.getElementById('password').type == "text")
        document.getElementById('password').type = "password";
}