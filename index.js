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
    var timeout = 20000;  
    if (socket.readyState == socket.OPEN) {  
        socket.send('');  
    }  
    timerID = setTimeout(keepAlive, timeout);  
}

function cancelKeepAlive() {  
    if (timerID) {  
        clearTimeout(timerID);  
    }  
}

function login(){
    socket = new WebSocket("wss://"+ipbox.value.replace("ws://","").replace("wss://", ""))
    socket.onmessage = onMessage;
    socket.onopen = function (e) {
        socket.send(`LOGIN ${unamebox.value} ${passbox.value}`)
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
    const div = `
    <div class="messageitem">
        <h1>${message["author"]["username"]} at ${new Date(message["date"]+" UTC").toLocaleString()}</h1>
        <p>${message["content"]}</p>
    </div>
    `
    messagelist.innerHTML+=div
    messagelist.scrollTop = messagelist.scrollHeight
}

function send(){
    socket.send(`SEND ${token} ${msginput.value}`)
    msginput.value = ""
}

function onMessage(e){
    var message = e.data
    var splitmessage = message.split(' ')
    console.log(message)
    switch (splitmessage[0]) {
        case "TOKEN":
            if(splitmessage[1] !== "NULL"){
                token = splitmessage[1]
                loginform.style.visibility = "hidden";
                mainpage.style.visibility = "visible";
                socket.send("GET "+token)
            } else { alert("Login failed."); socket = null }
            break
        case "MSGS":
            var jsons = message.substring(message.indexOf(' ') + 1)
            console.log(jsons)
            
            var json = JSON.parse(jsons)
            for (var i = 0; i < json.length; i++){
                handleMessage(json[i])
            }
            break
        case "MSG":
            var jsons = message.substring(message.indexOf(' ') + 1)
            console.log(jsons)
            handleMessage(JSON.parse(jsons))
            break
        case "__pong__":
            pong()
            break
    }
}
